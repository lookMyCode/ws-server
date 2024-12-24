import { PipeTransform } from '../pipe/PipeTransform';
import { Params } from '../Params';
import { QueryParams } from '../QueryParams';
import { ErrorFilter } from '../filter/ErrorFilter';
import { CanActivateConnect } from '../guard/CanActivateConnect';
import { Notifier } from '../Notifier';


export interface ControllerConfig {
  connectGuards?: CanActivateConnect[];
  requestMessagePipes?: PipeTransform[];
  responseMessagePipes?: PipeTransform[];
  onSocketDestroyCb?: () => void;
  params: Params;
  queryParams: QueryParams;
  errorFilter?: ErrorFilter;
  pathNotifier: Notifier<unknown>;
  currentPath: string;
}