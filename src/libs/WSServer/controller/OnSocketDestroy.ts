import WebSocket from 'ws';


export interface OnSocketDestroy {
  $onSocketDestroy: () => void | Promise<void>;
}