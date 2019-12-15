"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const shelljs_1 = tslib_1.__importStar(require("shelljs"));
const file_entry_1 = require("./file-entry");
const cache = new WeakMap();
const wrapHandler = {
    get(target, key) {
        let value = target[key];
        return typeof value === 'function' ?
            wrapFunction(value) : value;
    },
};
function wrapFunction(value) {
    let wrapped = cache.get(value);
    if (!wrapped)
        cache.set(value, wrapped = function (...args) {
            return value.apply(this, unwrapObject(args));
        });
    return wrapped;
}
const shellString = shelljs_1.ShellString.prototype;
shelljs_1.ShellString.prototype = new Proxy(shellString, wrapHandler);
exports.wrappedShell = new Proxy(shelljs_1.default, wrapHandler);
function unwrapObject(obj) {
    for (const key in obj) {
        if (obj[key] == null)
            continue;
        if (obj[key] instanceof file_entry_1.FileEntry) {
            obj[key] = obj[key][file_entry_1.Symbols.path];
            continue;
        }
        if (typeof obj[key] === 'object')
            unwrapObject(obj[key]);
    }
    return obj;
}
//# sourceMappingURL=shell-interop.js.map