import * as WebSocket from 'ws';
import { IncomingMessage } from 'http';

import { ControllerConfig } from "./ControllerConfig";
import { PipeTransform } from '../pipe/PipeTransform';
import { Params } from '../Params';
import { QueryParams } from '../QueryParams';
import { ErrorFilter } from '../filter/ErrorFilter';
import { CanActivateConnect } from '../guard/CanActivateConnect';
import { WS_STATUSES } from '../constants/WS_STATUSES';


export abstract class Controller {
  private __onSocketDestroyCb = () => {};
  private __webSockets: WebSocket[] = [];
  private __connectGuards: CanActivateConnect[];
  private __requestMessagePipes: PipeTransform[];
  private __responseMessagePipes: PipeTransform[];
  private __params: Params;
  private __queryParams: QueryParams;
  private __errorFIlter = new ErrorFilter();

  constructor(config: ControllerConfig) {
    const { 
      connectGuards,
      requestMessagePipes, 
      responseMessagePipes, 
      params, 
      queryParams, 
      errorFilter, 
      onSocketDestroyCb, 
    } = config;
    const _this: any = this;

    this.__connectGuards = connectGuards || [];
    this.__requestMessagePipes = requestMessagePipes || [];
    this.__responseMessagePipes = responseMessagePipes || [];
    this.__params = params;
    this.__queryParams = queryParams;

    if (errorFilter) this.__errorFIlter = errorFilter;
    if (onSocketDestroyCb) this.__onSocketDestroyCb = onSocketDestroyCb;

    if (_this.$onSocketInit) {
      try {
        _this.$onSocketInit();
      } catch (err) {
        this.__errorFIlter.handleError(err);
      }
    }
  }

  protected $getParams() {
    return {
      ...this.__params,
    }
  }

  protected $getQueryParams() {
    return {
      ...this.__queryParams,
    }
  }

  async __addSocket(ws: WebSocket, request: IncomingMessage) {
    try {
      this.__webSockets.push(ws);
      await this.__addEventsListeners(ws);
      await this.__onSocketConnect(ws, request);
    } catch (err: unknown) {
      this.__errorFIlter.handleError(err, ws);
    }
  }

  protected async $send(ws: WebSocket, msg: any) {
    try {
      let message = msg;
      const pipes = this.__responseMessagePipes;
      
      for (let i = 0, l = pipes.length; i < l; i++) {
        const pipe = pipes[i];
        
        try {
          message = await pipe.transform(message);
        } catch (err) {
          this.__errorFIlter.handleError(err, ws);
          return;
        }
      }

      ws.send(message);
    } catch (err) {
      this.__errorFIlter.handleError(err, ws);
    }
  }

  protected async $sendBroadcastMessage(msg: any) {
    try {
      let message = msg;
      const pipes = this.__responseMessagePipes;
      
      for (let i = 0, l = pipes.length; i < l; i++) {
        const pipe = pipes[i];
        
        try {
          message = await pipe.transform(message);
        } catch (err) {
          this.__errorFIlter.handleError(err);
          return;
        }
      }

      this.__webSockets.forEach(ws => {
        ws.send(message);
      });
    } catch (err) {
      this.__errorFIlter.handleError(err);
    }
  }

  private async __addEventsListeners(ws: WebSocket) {
    ws.on('error', (err: Error) => {
      try {
        this.__onSocketError.call(this, err, ws);
      } catch (err) {
        this.__errorFIlter.handleError(err);
      }
    });

    ws.on('close', (code, reason) => {
      try {
        this.__onSocketClose.call(this, code, reason, ws)
      } catch (err) {
        this.__errorFIlter.handleError(err);
      }
    });

    ws.on('message', message => {
      try {
        this.__onSocketMessage.call(this, message, ws);
      } catch (err) {
        this.__errorFIlter.handleError(err);
      }
    });
  }

  private async __onSocketConnect(ws: WebSocket, request: IncomingMessage) {
    try {
      const _this = this as any;
      const guards = this.__connectGuards || [];
      
      try {
        let accessDenied = false;

        for (let i = 0, l = guards.length; i < l; i++) {
          const guard = guards[i];
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

      if (_this.$onSocketConnect) _this.$onSocketConnect(ws);
    } catch (err: unknown) {
      this.__errorFIlter.handleError(err, ws);
    }
  }

  private __onSocketError(err: Error, ws: WebSocket) {
    try {
      if ((this as any).$onSocketError) (this as any).$onSocketError(err, ws);
    } catch (e) {
      this.__errorFIlter.handleError(e);
    }
  }

  private async __onSocketClose(code: number, reason: string | Buffer, ws: WebSocket) {
    try {
      if ((this as any).$onSocketClose) await (this as any).$onSocketClose(code, reason, ws);
      this.__webSockets = this.__webSockets.filter(socket => socket !== ws);
      if (!this.__webSockets.length) this.__onSocketDestroy();
    } catch (err) {
      this.__errorFIlter.handleError(err);
    }
  }

  private async __onSocketMessage(message: any, ws: WebSocket) {
    let msg: any = message;
    const pipes = this.__requestMessagePipes;
    
    for (let i = 0, l = pipes.length; i < l; i++) {
      const pipe = pipes[i];
      
      try {
        msg = await pipe.transform(msg);
      } catch (err) {
        return;
      }
    }
    
    try {
      if ((this as any).$onSocketMessage) (this as any).$onSocketMessage(msg, ws);
    } catch (err) {
      this.__errorFIlter.handleError(err);
    }
  }

  private __onSocketDestroy() {
    if ((this as any).$onSocketDestroy) (this as any).$onSocketDestroy();
    this.__onSocketDestroyCb();
  }
}
