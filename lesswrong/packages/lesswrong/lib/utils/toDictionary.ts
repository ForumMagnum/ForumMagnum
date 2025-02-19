

export function toDictionary<T,K extends string|number|symbol,V>(iterable: Iterable<T>, toKey: (i: T) => K, toValue: (i: T) => V): Partial<Record<K,V>>
{
  let result: Partial<Record<K,V>> = {};
  for (const item of iterable) {
    const key = toKey(item);
    const value = toValue(item);
    result[key] = value;
  }
  return result;
}
export default toDictionary;
