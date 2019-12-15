import { ChildProcess } from 'child_process';

export interface ExecProcess extends ChildProcess, PromiseLike<number> {
  pipe<T extends ChildProcess>(other: T): T;
}

const execProcessExtensions: Partial<ExecProcess> = {
  pipe(this: ExecProcess, other) {
    if(this.stdout && other.stdin)
      this.stdout.pipe(other.stdin);
    return other;
  },
  then(this: ExecProcess, onFulfilled, onRejected) {
    return new Promise<number>((resolve, reject) =>
      this.once('close', resolve).once('error', reject))
      .then(onFulfilled, onRejected);
  },
};

export function wrap(childProc: ChildProcess) {
  return Object.assign(childProc, execProcessExtensions) as ExecProcess;
}

export function extend(name: string, fn: (this: ExecProcess, ...args: any[]) => any) {
  (execProcessExtensions as any)[name] = fn;
}