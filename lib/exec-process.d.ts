/// <reference types="node" />
import { ChildProcess } from 'child_process';
export interface ExecProcess extends ChildProcess, PromiseLike<number> {
    pipe<T extends ChildProcess>(other: T): T;
}
export declare function wrap(childProc: ChildProcess): ExecProcess;
export declare function extend(name: string, fn: (this: ExecProcess, ...args: any[]) => any): void;
//# sourceMappingURL=exec-process.d.ts.map