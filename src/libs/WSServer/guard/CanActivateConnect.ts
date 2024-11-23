import WebSocket from 'ws';
import { IncomingMessage } from 'http';


export interface CanActivateConnect {
  canActivate: (ws: WebSocket, request: IncomingMessage) => boolean | Promise<boolean>,
}
