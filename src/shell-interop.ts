import shell, { ShellString } from 'shelljs';
import { FileEntry, Symbols } from './file-entry';

const cache = new WeakMap<Function, Function>();
const wrapHandler: ProxyHandler<any> = {
  get(target, key) {
    let value = target[key];
    return typeof value === 'function' ?
      wrapFunction(value) : value;
  },
};

function wrapFunction(value: Function) {
  let wrapped = cache.get(value);
  if(!wrapped)
    cache.set(value, wrapped = function(this: any, ...args: any[]) {
      return value.apply(this, unwrapObject(args));
    });
  return wrapped;
}

const shellString: ShellString = ShellString.prototype;
ShellString.prototype = new Proxy(shellString, wrapHandler);
export const wrappedShell = new Proxy(shell, wrapHandler);

function unwrapObject<T>(obj: T): T;
function unwrapObject(obj: any) {
  for(const key in obj) {
    if(obj[key] == null)
      continue;
    if(obj[key] instanceof FileEntry) {
      obj[key] = obj[key][Symbols.path];
      continue;
    }
    if(typeof obj[key] === 'object')
      unwrapObject(obj[key]);
  }
  return obj;
}