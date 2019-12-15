import {
  start as startRepl,
  ReplOptions,
  Recoverable as RecoverableError,
} from 'repl';
import { Symbols as $, FileEntry, roots } from './file-entry';
import { runInContext } from 'vm';
import { isThenable } from './utils';

const rootTemplate: PropertyDescriptorMap = Object.getOwnPropertyDescriptors(roots);
defineToTemplate('FileEntry', FileEntry);
for(const symbolKey of Object.keys($))
  defineToTemplate(`$$${symbolKey}`, $[symbolKey as keyof typeof $]);

for(const key of Reflect.ownKeys(process) as (keyof typeof process)[]) {
  if(typeof key !== 'string' || key[0] === '_')
    continue;
  const descriptor = Object.getOwnPropertyDescriptor(process, key);
  if(!descriptor)
    continue;
  if(descriptor.get || descriptor.set) {
    rootTemplate[key] = {
      get: descriptor.get && descriptor.get.bind(process),
      set: descriptor.set && descriptor.set.bind(process),
    };
    continue;
  }
  if(typeof descriptor.value === 'function') {
    descriptor.value = descriptor.value.bind(process);
    rootTemplate[key] = descriptor;
    continue;
  }
  const k = key;
  rootTemplate[key] = {
    get: () => process[k],
    set: descriptor.writable ? value => (process as any)[k] = value : undefined,
  };
}

function defineToTemplate(key: string, value: any, writable?: boolean) {
  rootTemplate[key] = { value, writable };
}

const recoverableErrrorRegex = /^Unexpected (end of input|token)/;

export function createRepl(options?: ReplOptions) {
  if(options == null)
    options = {};
  const repl = startRepl(Object.assign(options, {
    prompt: 'ESSH> ',
    eval: (code, context, filename, callback) => {
      let result: any;
      try {
        result = runInContext(code, context, { filename });
      } catch(e) {
        return callback(
          recoverableErrrorRegex.test(e.message) ? new RecoverableError(e) : e,
          undefined,
        );
      }
      try {
        if(isThenable(result))
          return result.then(
            asyncResult => callback(null, asyncResult),
            reason => callback(reason, undefined),
          );
      } catch(e) {
        return callback(e, undefined);
      }
      return callback(null, result);
    },
    writer: value => value != null ? value.toString() : '',
  } as ReplOptions)).on('reset', initContext);
  const instanceTemplate: PropertyDescriptorMap = {
    setPrompt: {
      value: repl.setPrompt.bind(repl),
      writable: true,
      configurable: true,
    },
  };
  initContext();
  function initContext() {
    Object.defineProperties(repl.context, rootTemplate);
    Object.defineProperties(repl.context, instanceTemplate);
  }
  return repl;
}
