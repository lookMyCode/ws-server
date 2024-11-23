import WebSocket from 'ws';


export interface CanActivateMessage {
  canActivate: (ws: WebSocket, message: WebSocket.RawData) => boolean | Promise<boolean>,
}
