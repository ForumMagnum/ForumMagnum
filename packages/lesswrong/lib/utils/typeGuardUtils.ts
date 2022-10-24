export function fieldIn<T>(field: string | number | symbol, ...objects: T[]): field is keyof T {
  return objects.every(object => field in object);
}