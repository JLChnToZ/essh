
export function isThenable(obj: unknown): obj is PromiseLike<unknown> {
  if(obj == null)
    return false;
  const type = typeof obj;
  if(type !== 'object' && type !== 'function')
    return false;
  return ('then' in (obj as any)) && typeof (obj as any).then === 'function';
}