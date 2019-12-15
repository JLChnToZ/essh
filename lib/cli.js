"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _1 = require(".");
const fs_1 = require("fs");
if (process.argv.length > 2) {
    _1.createRepl({
        input: fs_1.createReadStream(process.argv[2], 'utf8'),
    });
}
else {
    _1.createRepl();
}
//# sourceMappingURL=cli.js.map