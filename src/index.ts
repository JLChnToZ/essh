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
