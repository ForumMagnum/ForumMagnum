

export function toDictionary(iterable, toKey, toValue)
{
  let result = {};
  for (const item of iterable) {
    const key = toKey(item);
    const value = toValue(item);
    result[key] = value;
  }
  return result;
}
export default toDictionary;
