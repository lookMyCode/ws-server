import { PipeTransform } from '../pipe/PipeTransform';
import { Params } from '../Params';
import { QueryParams } from '../QueryParams';
import { ErrorFilter } from '../filter/ErrorFilter';


export interface ControllerConfig {
  requestMessagePipes?: PipeTransform[];
  responseMessagePipes?: PipeTransform[];
  onSocketDestroyCb?: () => void;
  params: Params;
  queryParams: QueryParams;
  errorFilter?: ErrorFilter;
}