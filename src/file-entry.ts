import {
  existsSync, unlinkSync, readdirSync, lstatSync, statSync,
  readFileSync, writeFileSync, copyFileSync, Stats,
} from 'fs';
import { execFile, execFileSync } from 'child_process';
import { resolve } from 'path';
import { platform, homedir, tmpdir } from 'os';
import { sync as glob } from 'fast-glob';
import { ExecProcess, wrap as wrapExec } from './exec-process';

export namespace Symbols {
  export const path = Symbol.for('path');
  export const data = Symbol.for('data');
  export const exists = Symbol.for('exists');
  export const stat = Symbol.for('stat');
  export const lstat = Symbol.for('lstat');
  export const glob = Symbol.for('glob');
  export const exec = Symbol.for('exec');
  export const execAsync = Symbol.for('execAsync');
}

const nonConfigurables: PropertyKey[] = [];

export interface FileEntryBase {
  readonly [Symbols.path]: string;
  readonly [Symbols.exists]: boolean;
  readonly [Symbols.lstat]: Stats;
  readonly [Symbols.stat]: Stats;
  [Symbols.data]: Buffer | string;
  [Symbols.glob](patterns: string | string[]): FileEntry[];
  [Symbols.exec](...args: any[]): string;
  [Symbols.execAsync](...args: any[]): ExecProcess;
}

export interface DirectoryEntry extends FileEntryBase {
  [path: string]: FileEntryBase;
}

export interface ExecutableEntry extends FileEntryBase {
  (...args: any[]): Buffer;
}

export interface FileEntry extends FileEntryBase, DirectoryEntry, ExecutableEntry {
}

export interface FileEntryConstructor {
  (path: string): FileEntry;
  new(path: string): FileEntry;
  readonly prototype: FileEntry;
}

export interface RootDirectories {
  readonly [directory: string]: FileEntry;
}

class FileEntryImpl extends Function implements FileEntryBase {
  private static cache = new Map<string, FileEntryBase>();
  public [Symbols.path]: string;

  public get [Symbols.exists]() {
    return existsSync(this[Symbols.path]);
  }

  public get [Symbols.data]() {
    return readFileSync(this[Symbols.path]);
  }

  public set [Symbols.data](value) {
    writeFileSync(this[Symbols.path], value);
  }

  public get [Symbols.lstat]() {
    return lstatSync(this[Symbols.path]);
  }

  public get [Symbols.stat]() {
    return statSync(this[Symbols.path]);
  }

  public constructor(path: string) {
    super();
    Object.defineProperty(this, Symbols.path, {
      value: path,
    });
  }

  public [Symbols.glob](patterns: string | string[]): FileEntry[] {
    return glob(patterns, { cwd: this[Symbols.path] })
    .map(FileEntryImpl.get, FileEntryImpl);
  }

  public [Symbols.exec](...args: any[]) {
    return execFileSync(this[Symbols.path], args);
  }

  public [Symbols.execAsync](...args: any[]) {
    return wrapExec(execFile(this[Symbols.path], resolveArgs(args)));
  }
  
  public toString() { return this[Symbols.path]; }

  public valueOf() { return this[Symbols.path]; }

  public static get(path: string) {
    let entry = this.cache.get(path);
    if(!entry) {
      entry = new Proxy<FileEntryBase>(new this(path), fileEntryHandler);
      this.cache.set(path, entry);
    }
    return entry as FileEntry;
  }

  public static ensureEntry(entry: FileEntry, path: string) {
    const resolvedPath = resolve(entry[Symbols.path], path);
    if(!(path in entry))
      entry[path] = this.get(resolvedPath);
  }

  public static bindGet(path: string) {
    return this.get.bind(this, path);
  }
}

const fileEntryHandler = Object.freeze<ProxyHandler<FileEntry>>({
  has(entry, key) {
    return typeof key === 'string' &&
      existsSync(resolve(entry[Symbols.path], key)) ||
      Reflect.has(entry, key);
  },

  get(entry, key, receiver) {
    if(typeof key === 'string')
      FileEntryImpl.ensureEntry(entry, key);
    return Reflect.get(entry, key, receiver);
  },

  set(entry, key, value, receiver) {
    switch(key) {
      case Symbols.data:
        return Reflect.set(entry, key, value, receiver);
      default:
        if(nonConfigurables.indexOf(key) >= 0)
          return Reflect.set(entry, key, value, receiver);
        if(typeof key === 'string' && (value instanceof FileEntryImpl)) {
          copyFileSync(value[Symbols.path], resolve(entry[Symbols.path], key));
          return true;
        }
        return false;
    }
  },

  deleteProperty(entry, key) {
    if(typeof key !== 'string' || nonConfigurables.indexOf(key) >= 0)
      return false;
    const resolvedPath = resolve(entry[Symbols.path], key);
    if(!existsSync(resolvedPath))
      return false;
    unlinkSync(resolvedPath);
    return !existsSync(resolvedPath);
  },

  getOwnPropertyDescriptor(entry, key) {
    if(nonConfigurables.indexOf(key) >= 0)
      return Reflect.getOwnPropertyDescriptor(entry, key);
    if(typeof key === 'string') {
      FileEntryImpl.ensureEntry(entry, key);
      if(entry[key][Symbols.exists]) return {
        value: entry[key],
        writable: false,
        configurable: true,
        enumerable: true,
      };
    }
  },

  ownKeys(entry) {
    if(!entry[Symbols.exists] || !entry[Symbols.lstat].isDirectory())
      return nonConfigurables;
    const keys: PropertyKey[] = readdirSync(entry[Symbols.path]);
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

export const FileEntry = new Proxy<FileEntryConstructor>(FileEntryImpl as any, {
  apply(_, _this, [path]) {
    return FileEntryImpl.get(path);
  },
  construct(_, [path]) {
    return FileEntryImpl.get(path);
  },
});

export const roots: RootDirectories = {
  get $() {
    return FileEntryImpl.get(process.cwd());
  },
  get $home() {
    return FileEntryImpl.get(homedir());
  },
  get $tmp() {
    return FileEntryImpl.get(tmpdir());
  },
};

{
  const fn = new FileEntryImpl('dummy');
  for(const key of Reflect.ownKeys(fn)) {
    const descriptor = Object.getOwnPropertyDescriptor(fn, key)!;
    if(!descriptor.configurable)
      nonConfigurables.push(key);
  }
}

switch(platform()) {
  case 'win32': {
    const startDrive = 'A'.charCodeAt(0);
    const endDrive = 'Z'.charCodeAt(0);
    for(let i = startDrive; i <= endDrive; i++) {
      const driveLetter = String.fromCharCode(i);
      Object.defineProperty(roots, `$${driveLetter}`, {
        get: FileEntryImpl.bindGet(`${driveLetter}:`),
        enumerable: true,
        configurable: true,
      });
    }
    break;
  }
  default: {
    Object.defineProperty(roots, '$root', {
      get: FileEntryImpl.bindGet('/'),
      enumerable: true,
      configurable: true,
    });
    break;
  }
}

function resolveArgs(args: any): any[] {
  if(!args || typeof args !== 'object')
    return [];
  if(!Array.isArray(args))
    args = Array.from(args);
  for(let i = 0; i < args.length; i++)
    if(typeof args[i] !== 'string')
      args[i] = args[i] != null ? args[i].toString() : '';
  return args;
}

function disabledHandler() {
  return false;
}
