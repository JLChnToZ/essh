/// <reference types="node" />
import { ChildProcess } from 'child_process';
import { Writable } from 'stream';
export interface ExecProcess extends ChildProcess, PromiseLike<number> {
    pipe<T extends ChildProcess>(other: T, stdout?: boolean, stderr?: boolean, extra1?: boolean, extra2?: boolean): T;
    pipe<T extends Writable>(other: T, stdout?: boolean, stderr?: boolean, extra1?: boolean, extra2?: boolean): T;
}
export declare function wrap(childProc: ChildProcess): ExecProcess;
export declare function extend(name: string, fn: (this: ExecProcess, ...args: any[]) => any): void;
//# sourceMappingURL=exec-process.d.ts.map