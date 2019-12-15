/// <reference types="node" />
import { Stats } from 'fs';
import { ExecProcess } from './exec-process';
export declare namespace Symbols {
    const path: unique symbol;
    const data: unique symbol;
    const exists: unique symbol;
    const stat: unique symbol;
    const lstat: unique symbol;
    const glob: unique symbol;
    const exec: unique symbol;
    const execAsync: unique symbol;
}
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
    new (path: string): FileEntry;
    readonly prototype: FileEntry;
}
export interface RootDirectories {
    readonly [directory: string]: FileEntry;
    _: FileEntry;
}
export declare const FileEntry: FileEntryConstructor;
export declare const roots: RootDirectories;
//# sourceMappingURL=file-entry.d.ts.map