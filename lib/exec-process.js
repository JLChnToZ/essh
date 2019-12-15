"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const stream_1 = require("stream");
const execProcessExtensions = {
    pipe(other, stdout = true, stderr = false, extra1 = false, extra2 = false) {
        if (other instanceof stream_1.Stream)
            return pipeStdio(this, other, stdout, stderr, extra1, extra2);
        if (other.stdin)
            pipeStdio(this, other.stdin, stdout, stderr, extra1, extra2);
        return other;
    },
    then(onFulfilled, onRejected) {
        return new Promise((resolve, reject) => this.once('close', resolve).once('error', reject))
            .then(onFulfilled, onRejected);
    },
};
function pipeStdio(current, other, stdout, stderr, extra1, extra2) {
    if (stdout && current.stdout)
        current.stdout.pipe(other);
    if (stderr && current.stderr)
        current.stderr.pipe(other);
    if (extra1 && current.stdio[3])
        current.stdio[3].pipe(other);
    if (extra2 && current.stdio[4])
        current.stdio[4].pipe(other);
    return other;
}
function wrap(childProc) {
    return Object.assign(childProc, execProcessExtensions);
}
exports.wrap = wrap;
function extend(name, fn) {
    execProcessExtensions[name] = fn;
}
exports.extend = extend;
//# sourceMappingURL=exec-process.js.map