"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const execProcessExtensions = {
    pipe(other) {
        if (this.stdout && other.stdin)
            this.stdout.pipe(other.stdin);
        return other;
    },
    then(onFulfilled, onRejected) {
        return new Promise((resolve, reject) => this.once('close', resolve).once('error', reject))
            .then(onFulfilled, onRejected);
    },
};
function wrap(childProc) {
    return Object.assign(childProc, execProcessExtensions);
}
exports.wrap = wrap;
//# sourceMappingURL=exec-process.js.map