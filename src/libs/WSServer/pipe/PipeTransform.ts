export interface PipeTransform {
  transform: (message: any, ...params: unknown[]) => unknown | Promise<unknown>,
}
