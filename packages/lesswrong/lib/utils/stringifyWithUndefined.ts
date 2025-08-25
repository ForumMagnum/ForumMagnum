
const undefinedPlaceholder = '$placeholder.undefined$';
const undefinedPlaceholderJson = JSON.stringify(undefinedPlaceholder);
/**
 * Stringify a value to a JSON-ish format, except that `undefined` values are
 * preserved.
 */
export function stringifyWithUndefined(value: any) {
  let numTimesUndefinedSeen = 0;

  // Stringify, replacing all instances of the value `undefined` with
  // `undefinedPlaceholder` and counting the number of replacements done.
  const result = JSON.stringify(value, (_, v) => {
    if (v === undefined) {
      numTimesUndefinedSeen++;
      return undefinedPlaceholder;
    } else {
      return v;
    }
  })
  
  if (!numTimesUndefinedSeen) {
    return result;
  }
  
  // Replace `undefinedPlaceholder` with `undefined`. Because we don't have a
  // guarantee that `undefinedPlaceholder` didn't appear in the input, we have
  // a fast path, which assumes it doesn't, and check that the string length
  // changed by the amount we expect given the number of substitutions we did.
  const resultWithUndefined = result.replaceAll(undefinedPlaceholderJson, "undefined");
  if (resultWithUndefined.length === result.length
    + (numTimesUndefinedSeen * ("undefined".length - undefinedPlaceholderJson.length))
  ) {
    // Fast path
    return resultWithUndefined;
  }
  
  // Slow path: Try different placeholders
  let changedPlaceholder = "$apollo.undefined$";

  const stringified = JSON.stringify(value);
  while (stringified.includes(JSON.stringify(changedPlaceholder))) {
    changedPlaceholder = `$apollo.undefined.${Math.random()}`;
  }
  return JSON.stringify(value, (_, v) =>
    v === undefined ? changedPlaceholder : v
  ).replaceAll(JSON.stringify(changedPlaceholder), "undefined");
}
