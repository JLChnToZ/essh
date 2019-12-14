"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const repl_1 = require("repl");
const file_entry_1 = require("./file-entry");
const rootTemplate = Object.getOwnPropertyDescriptors(file_entry_1.roots);
defineToTemplate('FileEntry', file_entry_1.FileEntry);
for (const symbolKey of Object.keys(file_entry_1.Symbols))
    defineToTemplate(`$$${symbolKey}`, file_entry_1.Symbols[symbolKey]);
const repl = repl_1.start({
    prompt: 'ESSH> ',
    writer(value) {
        return value != null ? value.toString() : '';
    },
});
Object.defineProperties(repl.context, rootTemplate);
function defineToTemplate(key, value, writable) {
    rootTemplate[key] = { value, writable };
}
//# sourceMappingURL=index.js.map