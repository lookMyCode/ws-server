import WebSocket from 'ws';


export interface OnSocketInit {
  $onSocketInit: () => void | Promise<void>;
}