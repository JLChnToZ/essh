"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const repl_1 = require("repl");
const file_entry_1 = require("./file-entry");
const vm_1 = require("vm");
const utils_1 = require("./utils");
const rootTemplate = Object.getOwnPropertyDescriptors(file_entry_1.roots);
defineToTemplate('FileEntry', file_entry_1.FileEntry);
for (const symbolKey of Object.keys(file_entry_1.Symbols))
    defineToTemplate(`$$${symbolKey}`, file_entry_1.Symbols[symbolKey]);
for (const key of Reflect.ownKeys(process)) {
    if (typeof key !== 'string' || key[0] === '_')
        continue;
    const descriptor = Object.getOwnPropertyDescriptor(process, key);
    if (!descriptor)
        continue;
    if (descriptor.get || descriptor.set) {
        rootTemplate[key] = {
            get: descriptor.get && descriptor.get.bind(process),
            set: descriptor.set && descriptor.set.bind(process),
        };
        continue;
    }
    if (typeof descriptor.value === 'function') {
        descriptor.value = descriptor.value.bind(process);
        rootTemplate[key] = descriptor;
        continue;
    }
    const k = key;
    rootTemplate[key] = {
        get: () => process[k],
        set: descriptor.writable ? value => process[k] = value : undefined,
    };
}
function defineToTemplate(key, value, writable) {
    rootTemplate[key] = { value, writable };
}
const recoverableErrrorRegex = /^Unexpected (end of input|token)/;
function createRepl(options) {
    if (options == null)
        options = {};
    const repl = repl_1.start(Object.assign(options, {
        prompt: 'ESSH> ',
        eval: (code, context, filename, callback) => {
            let result;
            try {
                result = vm_1.runInContext(code, context, { filename });
            }
            catch (e) {
                return callback(recoverableErrrorRegex.test(e.message) ? new repl_1.Recoverable(e) : e, undefined);
            }
            try {
                if (utils_1.isThenable(result))
                    return result.then(asyncResult => callback(null, asyncResult), reason => callback(reason, undefined));
            }
            catch (e) {
                return callback(e, undefined);
            }
            return callback(null, result);
        },
        writer: value => value != null ? value.toString() : '',
    })).on('reset', initContext);
    const instanceTemplate = {
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
exports.createRepl = createRepl;
//# sourceMappingURL=index.js.map