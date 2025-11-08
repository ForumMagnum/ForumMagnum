/**
 * Shared utility functions for UltraFeed settings management
 */

/**
 * Parses a numeric input value, returning either the parsed number or a default value.
 * Handles empty strings, numeric strings, and already-parsed numbers.
 * 
 * @param value - The input value to parse (can be string, number, or empty string)
 * @param defaultValueOnNaN - The value to return if parsing fails or input is empty
 * @returns The parsed number or the default value
 */
export const parseNumericInputAsZeroOrNumber = (
  value: string | number | '',
  defaultValueOnNaN: number 
): number => {
  if (value === '') {
    return defaultValueOnNaN;
  }
  if (typeof value === 'number') {
    return value;
  }
  const parsed = parseFloat(value);
  return isNaN(parsed) ? defaultValueOnNaN : parsed;
};

/**
 * Custom merge function for lodash mergeWith that uses nullish coalescing.
 * Prefers source values unless they are null or undefined, in which case it uses the object value.
 * 
 * Used with lodash's mergeWith to merge user settings with defaults while preserving
 * explicit zero/false values but replacing null/undefined with defaults.
 * 
 * @param objValue - The destination object value (typically the default)
 * @param srcValue - The source value (typically the user's setting)
 * @returns The merged value using nullish coalescing
 */
export const customNullishCoalesceProperties = (objValue: any, srcValue: any): any => {
  return srcValue ?? objValue;
};

/**
 * Processes a numeric field input, converting strings to numbers or empty string.
 * Used for controlled inputs where we want to allow temporary empty states.
 * 
 * @param value - The input value from a form field
 * @returns Either a parsed number or empty string (for invalid/empty input)
 */
export const processNumericFieldInput = (value: string | number): number | '' => {
  const strValue = String(value).trim();
  if (strValue === '') {
    return '';
  }
  const parsed = parseFloat(strValue);
  return isNaN(parsed) ? '' : parsed;
};

/**
 * Processes an integer field input, ensuring the result is an integer or empty string.
 * Used for controlled inputs that should only accept whole numbers.
 * 
 * @param value - The input value from a form field
 * @returns Either a parsed integer or empty string (for invalid/empty input)
 */
export const processIntegerFieldInput = (value: string | number): number | '' => {
  const strValue = String(value).trim();
  if (strValue === '') {
    return '';
  }
  const parsed = parseInt(strValue, 10);
  return (!isNaN(parsed) && Number.isInteger(Number(strValue))) ? parsed : '';
};

