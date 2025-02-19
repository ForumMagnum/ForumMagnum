export function allOf<T extends any[]>(
  ...fns: ((...args: T) => boolean)[]
): (...args: T) => boolean {
  return (...args: T) => fns.every(fn => fn(...args));
}
