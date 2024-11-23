import * as WebSocket from 'ws';
import { IncomingMessage } from 'http';

import { WSServerConfig } from './WSServerConfig';
import { CanActivateConnect } from './guard/CanActivateConnect';
import { OpenedController } from './OpenedController';
import { Route } from './route/Route';
import { Params } from './Params';
import { QueryParams } from './QueryParams';
import { ErrorFilter } from './filter/ErrorFilter';
import { WS_STATUSES } from './constants/WS_STATUSES';


export class WSServer {
  private webSocketServer: WebSocket.Server;
  private connectGuards: CanActivateConnect[] = [];
  private openedControllers: {[path: string]: OpenedController} = {};
  private errorFilter = new ErrorFilter();

  constructor(config: WSServerConfig) {
    let { port, routes, connectGuards, onInit, onConnect, prefixPath, errorFilter } = config;

    if (errorFilter) {
      this.errorFilter = errorFilter;
    }

    if (!prefixPath) prefixPath = '/';
    if (!prefixPath?.startsWith('/')) {
      prefixPath = '/' + prefixPath;
    }

    this.webSocketServer = new WebSocket.Server({port});
    this.connectGuards = connectGuards || [];

    this.webSocketServer.on('connection', async (ws: WebSocket, request: IncomingMessage) => {
      try {
        try {
          let accessDenied = false;

          for (let i = 0, l = this.connectGuards.length; i < l; i++) {
            const guard = this.connectGuards[i];
            const canActivate = await guard.canActivate(ws, request);

            if (!canActivate) {
              accessDenied = true;
              break;
            }
          }

          if (accessDenied) {
            ws.close(WS_STATUSES.ACCESS_DENIED.code, WS_STATUSES.ACCESS_DENIED.status);
            return;
          }
        } catch (err: unknown) {
          if (err instanceof Error) {
            ws.close(WS_STATUSES.ACCESS_DENIED.code, err.message); 
          } else {
            ws.close(WS_STATUSES.ACCESS_DENIED.code, WS_STATUSES.ACCESS_DENIED.status);
          }

          return;
        }

        const queryParams: QueryParams = {};

        const url = new URL(request.url || '', 'https://test.test');
        const { searchParams } = url;

        Array.from(url.searchParams.keys()).forEach(key => {
          queryParams[key] = searchParams.get(key);
        });

        let currentPath = (request.url || '')
          .split('?')[0]
          .trim();
          
        if (!currentPath.startsWith('/')) {
          currentPath = '/' + currentPath;
        }
        if (currentPath.startsWith(prefixPath)) {
          currentPath = currentPath.substring(prefixPath.length);
        }
        if (!currentPath.startsWith('/')) {
          currentPath = '/' + currentPath;
        }
        if (currentPath.endsWith('/')) {
          currentPath = currentPath.substring(0, currentPath.length - 1);
        }

        if (this.openedControllers[currentPath]) {
          const controller = this.openedControllers[currentPath].controller;
          await controller.__addSocket(ws, request);
        } else {
          const currentPathParts = currentPath
            .split('?')[0]
            .split('/')
            .map(x => x.trim())
            .filter(x => !!x);
          const currentPathPartsLength = currentPathParts.length;
          let params: Params = {};
          let currentRoute: Route | undefined;

          for (let i = 0, l = (routes || []).length; i < l; i++) {
            params = {};
            const route = routes[i];
            const pathParts = route.path
              .trim()
              .split('/')
              .map(x => x.trim())
              .filter(x => !!x);

            const pathPartsLength = pathParts.length;
            if (pathPartsLength !== currentPathPartsLength) continue;

            let found = true;
              
            for (let j = 0; j < pathPartsLength; j++) {
              const pathPart = pathParts[j];
              const currentPathPart = currentPathParts[j];
              const isParam = pathPart.startsWith(':');

              if (!isParam && pathPart !== currentPathPart) {
                found = false;
                break;
              }

              if (isParam) {
                const key = pathPart.substring(1);
                params[key] = currentPathPart;
              }
            }

            if (found) {
              currentRoute = route;
              break;
            }
          }

          if (!currentRoute) {
            ws.close(WS_STATUSES.NOT_FOUND.code, WS_STATUSES.NOT_FOUND.status);
            return;
          }

          const { path, controller: C } = currentRoute;
          const controller = new C({
            connectGuards: currentRoute.connectGuards || [],
            requestMessagePipes: currentRoute.requestMessagePipes || [],
            responseMessagePipes: currentRoute.responseMessagePipes || [],
            onSocketDestroyCb: () => {
              delete this.openedControllers[currentPath];
            },
            params,
            queryParams,
          });

          const openedController = {
            path,
            currentPath,
            controller,
          }

          this.openedControllers[currentPath] = openedController;
          await controller.__addSocket(ws, request);
        }

        if (onConnect) {
          try {
            await onConnect();
          } catch (err: unknown) {
            if (err instanceof Error) {
              ws.close(WS_STATUSES.INTERNAL_SERVER_ERROR.code, WS_STATUSES.INTERNAL_SERVER_ERROR.status);
            } else {
              ws.close(WS_STATUSES.INTERNAL_SERVER_ERROR.code, WS_STATUSES.INTERNAL_SERVER_ERROR.status);
            }
          }
        }
      } catch (err: unknown) {
        this.errorFilter.handleError(err, ws);
      }
    });

    if (onInit) onInit();
  }
}