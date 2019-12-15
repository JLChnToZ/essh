import { ChildProcess } from 'child_process';
import { Stream, Writable } from 'stream';

export interface ExecProcess extends ChildProcess, PromiseLike<number> {
  pipe<T extends ChildProcess>(other: T, stdout?: boolean, stderr?: boolean, extra1?: boolean, extra2?: boolean): T;
  pipe<T extends Writable>(other: T, stdout?: boolean, stderr?: boolean, extra1?: boolean, extra2?: boolean): T;
}

const execProcessExtensions: Partial<ExecProcess> = {
  pipe(this: ExecProcess, other: ChildProcess | Writable, stdout = true, stderr = false, extra1 = false, extra2 = false) {
    if(other instanceof Stream)
      return pipeStdio(this, other as Writable, stdout, stderr, extra1, extra2);
    if(other.stdin)
      pipeStdio(this, other.stdin, stdout, stderr, extra1, extra2)
    return other;
  },
  then(this: ExecProcess, onFulfilled, onRejected) {
    return new Promise<number>((resolve, reject) =>
      this.once('close', resolve).once('error', reject))
      .then(onFulfilled, onRejected);
  },
};

function pipeStdio(current: ExecProcess, other: Writable, stdout: boolean, stderr: boolean, extra1: boolean, extra2: boolean) {
  if(stdout && current.stdout)
    current.stdout.pipe(other);
  if(stderr && current.stderr)
    current.stderr.pipe(other);
  if(extra1 && current.stdio[3])
    current.stdio[3].pipe(other);
  if(extra2 && current.stdio[4])
    current.stdio[4].pipe(other);
  return other;
}

export function wrap(childProc: ChildProcess) {
  return Object.assign(childProc, execProcessExtensions) as ExecProcess;
}

export function extend(name: string, fn: (this: ExecProcess, ...args: any[]) => any) {
  (execProcessExtensions as any)[name] = fn;
}