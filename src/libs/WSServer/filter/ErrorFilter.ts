import { WebSocket } from 'ws';


export class ErrorFilter {

  public handleError(err: unknown, ws?: WebSocket) {
    console.log('ErrorFilter')
    console.error(err);
  }
}
