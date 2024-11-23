import { IncomingMessage } from 'http';
import { CanActivateConnect } from './libs/WSServer/guard/CanActivateConnect';
import { WSServer } from './libs/WSServer/WSServer';
import WebSocket from 'ws';
import { Controller } from './libs/WSServer/controller/Controller';
import { ControllerConfig } from './libs/WSServer/controller/ControllerConfig';
import { OnSocketConnect } from './libs/WSServer/controller/OnSocketConnect';
import { OnSocketError } from './libs/WSServer/controller/OnSocketError';
import { OnSocketClose } from './libs/WSServer/controller/OnSocketClose';
import { OnSocketMessage } from './libs/WSServer/controller/OnSocketMessage';
import { OnSocketDestroy } from './libs/WSServer/controller/OnSocketDestroy';
import { PipeTransform } from './libs/WSServer/pipe/PipeTransform';
import { OnSocketInit } from './libs/WSServer/controller/OnSocketInit';


class AuthGuard implements CanActivateConnect {

  async canActivate(ws: WebSocket, request: IncomingMessage) {
    const url = new URL(request.url || '', 'https://test.test');
    return url.searchParams.get('token') === '123';
  }
}

class BufferToStringPipe implements PipeTransform {

  transform(message: Buffer) {
    return message.toString();
  }
}

class ParseJSONPipe implements PipeTransform {

  transform(message: string) {
    return JSON.parse(message); 
  }
}

class StringifyJSONPipe implements PipeTransform {

  transform(message: any) {
    return JSON.stringify(message);
  }
}

class MainController extends Controller implements OnSocketInit, OnSocketConnect, OnSocketMessage, OnSocketError, OnSocketClose, OnSocketDestroy {

  constructor(config: ControllerConfig) {
    super(config);
  }

  $onSocketInit() {
    console.log('onSocketInit')
  }

  $onSocketConnect(ws: WebSocket) {
    this.$send(ws, 'Welcome');
    this.$sendBroadcastMessage('New member');
  }

  $onSocketMessage(message: any, ws: WebSocket) {
    this.$sendBroadcastMessage(message);
    
  }

  $onSocketError(err: Error, ws: WebSocket) {
    console.log(err)
    ws.send('onSocketError');
    this.$sendBroadcastMessage('New error');
  }

  $onSocketClose(code: number, reason: string | Buffer) {
    this.$sendBroadcastMessage('onSocketClose');
  }

  $onSocketDestroy() {
    console.log('onSocketDestroy');
  }
}


const server = new WSServer({
  port: 3030,
  routes: [
    {
      path: '',
      controller: MainController, 
      requestMessagePipes: [
        new BufferToStringPipe(),
        // new ParseJSONPipe(),
      ],
      responseMessagePipes: [
        // new StringifyJSONPipe(),
      ],
    },
    {
      path: ':id',
      controller: MainController, 
      requestMessagePipes: [
        new BufferToStringPipe(),
        // new ParseJSONPipe(),
      ],
      responseMessagePipes: [
        // new StringifyJSONPipe(),
      ],
    },
  ],
  connectGuards: [new AuthGuard()],
  onInit: () => {
    console.log('WSServer was started on port 3030');
  },
});
