"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function isThenable(obj) {
    if (obj == null)
        return false;
    const type = typeof obj;
    if (type !== 'object' && type !== 'function')
        return false;
    return ('then' in obj) && typeof obj.then === 'function';
}
exports.isThenable = isThenable;
//# sourceMappingURL=utils.js.map