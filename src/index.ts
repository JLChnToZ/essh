import { REPLServer, start as startRepl } from 'repl';
import { Symbols as $, FileEntry, roots } from './file-entry';

const rootTemplate = Object.getOwnPropertyDescriptors<any>(roots);
defineToTemplate('FileEntry', FileEntry);
for(const symbolKey of Object.keys($))
  defineToTemplate(`$$${symbolKey}`, $[symbolKey as keyof typeof $]);
  
const repl = startRepl({
  prompt: 'ESSH> ',
  writer(this: REPLServer, value: any) {
    return value != null ? value.toString() : '';
  },
});
Object.defineProperties(repl.context, rootTemplate);

function defineToTemplate(key: string, value: any, writable?: boolean) {
  rootTemplate[key] = { value, writable };
}
