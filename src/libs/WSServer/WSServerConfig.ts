import { ErrorFilter } from "./filter/ErrorFilter";
import { CanActivateConnect } from "./guard/CanActivateConnect";
import { Route } from "./route/Route";


export interface WSServerConfig {
  port: number;
  routes: Route[],
  onInit?: () => void | Promise<void>;
  onConnect?: () => void | Promise<void>;
  connectGuards?: CanActivateConnect[];
  prefixPath?: string;
  errorFilter?: ErrorFilter;
}