import { Controller } from "../controller/Controller";
import { ControllerConfig } from "../controller/ControllerConfig";
import { PipeTransform } from "../pipe/PipeTransform";


export interface Route {
  path: string,
  controller: new (config: ControllerConfig) => Controller,
  requestMessagePipes?: PipeTransform[];
  responseMessagePipes?: PipeTransform[];
}
