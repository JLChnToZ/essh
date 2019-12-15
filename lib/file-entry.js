"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
const child_process_1 = require("child_process");
const path_1 = require("path");
const os_1 = require("os");
const fast_glob_1 = require("fast-glob");
const exec_process_1 = require("./exec-process");
var Symbols;
(function (Symbols) {
    Symbols.path = Symbol.for('path');
    Symbols.data = Symbol.for('data');
    Symbols.exists = Symbol.for('exists');
    Symbols.stat = Symbol.for('stat');
    Symbols.lstat = Symbol.for('lstat');
    Symbols.glob = Symbol.for('glob');
    Symbols.exec = Symbol.for('exec');
    Symbols.execAsync = Symbol.for('execAsync');
})(Symbols = exports.Symbols || (exports.Symbols = {}));
const nonConfigurables = [];
class FileEntryImpl extends Function {
    constructor(path) {
        super();
        Object.defineProperty(this, Symbols.path, {
            value: path,
        });
    }
    get [(Symbols.path, Symbols.exists)]() {
        return fs_1.existsSync(this[Symbols.path]);
    }
    get [Symbols.data]() {
        return fs_1.readFileSync(this[Symbols.path]);
    }
    set [Symbols.data](value) {
        fs_1.writeFileSync(this[Symbols.path], value);
    }
    get [Symbols.lstat]() {
        return fs_1.lstatSync(this[Symbols.path]);
    }
    get [Symbols.stat]() {
        return fs_1.statSync(this[Symbols.path]);
    }
    [Symbols.glob](patterns) {
        return fast_glob_1.sync(patterns, { cwd: this[Symbols.path] })
            .map(FileEntryImpl.get, FileEntryImpl);
    }
    [Symbols.exec](...args) {
        return child_process_1.execFileSync(this[Symbols.path], resolveArgs(args));
    }
    [Symbols.execAsync](...args) {
        return exec_process_1.wrap(child_process_1.spawn(this[Symbols.path], resolveArgs(args), {
            windowsHide: true,
        }));
    }
    toString() { return this[Symbols.path]; }
    valueOf() { return this[Symbols.path]; }
    static get(path) {
        let entry = this.cache.get(path);
        if (!entry) {
            entry = new Proxy(new this(path), fileEntryHandler);
            this.cache.set(path, entry);
        }
        return entry;
    }
    static ensureEntry(entry, path) {
        const resolvedPath = path_1.resolve(entry[Symbols.path], path);
        if (!(path in entry))
            entry[path] = this.get(resolvedPath);
    }
    static bindGet(path) {
        return this.get.bind(this, path);
    }
}
FileEntryImpl.cache = new Map();
const fileEntryHandler = Object.freeze({
    has(entry, key) {
        return typeof key === 'string' &&
            fs_1.existsSync(path_1.resolve(entry[Symbols.path], key)) ||
            Reflect.has(entry, key);
    },
    get(entry, key, receiver) {
        if (typeof key === 'string')
            FileEntryImpl.ensureEntry(entry, key);
        return Reflect.get(entry, key, receiver);
    },
    set(entry, key, value, receiver) {
        switch (key) {
            case Symbols.data:
                return Reflect.set(entry, key, value, receiver);
            default:
                if (nonConfigurables.indexOf(key) >= 0)
                    return Reflect.set(entry, key, value, receiver);
                if (typeof key === 'string' && (value instanceof FileEntryImpl)) {
                    fs_1.copyFileSync(value[Symbols.path], path_1.resolve(entry[Symbols.path], key));
                    return true;
                }
                return false;
        }
    },
    deleteProperty(entry, key) {
        if (typeof key !== 'string' || nonConfigurables.indexOf(key) >= 0)
            return false;
        const resolvedPath = path_1.resolve(entry[Symbols.path], key);
        if (!fs_1.existsSync(resolvedPath))
            return false;
        fs_1.unlinkSync(resolvedPath);
        return !fs_1.existsSync(resolvedPath);
    },
    getOwnPropertyDescriptor(entry, key) {
        if (nonConfigurables.indexOf(key) >= 0)
            return Reflect.getOwnPropertyDescriptor(entry, key);
        if (typeof key === 'string') {
            FileEntryImpl.ensureEntry(entry, key);
            if (entry[key][Symbols.exists])
                return {
                    value: entry[key],
                    writable: false,
                    configurable: true,
                    enumerable: true,
                };
        }
    },
    ownKeys(entry) {
        if (!entry[Symbols.exists] || !entry[Symbols.lstat].isDirectory())
            return nonConfigurables;
        const keys = fs_1.readdirSync(entry[Symbols.path]);
        keys.push(...nonConfigurables);
        return keys;
    },
    apply(entry, _this, args) {
        return entry[Symbols.exec].apply(entry, args);
    },
    construct() {
        throw new TypeError('FileEntry instance is not a constructor, please remove new to execute.');
    },
    defineProperty: disabledHandler,
    setPrototypeOf: disabledHandler,
    preventExtensions: disabledHandler,
});
exports.FileEntry = new Proxy(FileEntryImpl, {
    apply(_, _this, [path]) {
        return FileEntryImpl.get(path);
    },
    construct(_, [path]) {
        return FileEntryImpl.get(path);
    },
});
exports.roots = {
    get $() {
        return FileEntryImpl.get(process.cwd());
    },
    get $home() {
        return FileEntryImpl.get(os_1.homedir());
    },
    get $tmp() {
        return FileEntryImpl.get(os_1.tmpdir());
    },
};
{
    const fn = new FileEntryImpl('dummy');
    for (const key of Reflect.ownKeys(fn)) {
        const descriptor = Object.getOwnPropertyDescriptor(fn, key);
        if (!descriptor.configurable)
            nonConfigurables.push(key);
    }
}
switch (os_1.platform()) {
    case 'win32': {
        const startDrive = 'A'.charCodeAt(0);
        const endDrive = 'Z'.charCodeAt(0);
        for (let i = startDrive; i <= endDrive; i++) {
            const driveLetter = String.fromCharCode(i);
            Object.defineProperty(exports.roots, `$${driveLetter}`, {
                get: FileEntryImpl.bindGet(`${driveLetter}:`),
                enumerable: true,
                configurable: true,
            });
        }
        break;
    }
    default: {
        Object.defineProperty(exports.roots, '$root', {
            get: FileEntryImpl.bindGet('/'),
            enumerable: true,
            configurable: true,
        });
        break;
    }
}
function resolveArgs(args) {
    if (!args || typeof args !== 'object')
        return [];
    if (!Array.isArray(args))
        args = Array.from(args);
    for (let i = 0; i < args.length; i++)
        if (typeof args[i] !== 'string')
            args[i] = args[i] != null ? args[i].toString() : '';
    return args;
}
function disabledHandler() {
    return false;
}
//# sourceMappingURL=file-entry.js.map