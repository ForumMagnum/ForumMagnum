import { useCallback, useEffect, useState } from "react";
import { capitalize } from "@/lib/vulcan-lib/utils";
import { safeLocalStorage } from "@/lib/utils/safeLocalStorage";

type LocalPromptExample<Suffix extends string> = {
  [K in Suffix]: string | undefined;
} & {
  [K in `set${Capitalize<Suffix>}`]: React.Dispatch<string>;
};

/**
 * A React hook for managing state that persists in localStorage.
 * 
 * This hook creates a state variable that is synchronized with localStorage, allowing state to persist
 * across page refreshes and browser sessions. It returns an object with the current value and a setter
 * function, similar to useState.
 * 
 * The hook takes a key suffix and a function to generate the full storage key, allowing for namespaced
 * storage keys (e.g. prefixed with user IDs). If the value is set to the default, it will be removed
 * from localStorage. This is so that if we change the default value, we don't have to worry about
 * migrating old values that were stored under the old default.
 * 
 * @param key - The suffix for the localStorage key
 * @param getStorageKey - Function to generate the full storage key
 * @param defaultValue - Default value to use if nothing exists in localStorage
 * @returns An object with the current value and a setter function, with keys determined by the suffix
 * 
 * @example
 * const { myValue, setMyValue } = useLocalStorageState(
 *   "myValue",
 *   (key) => `user_${userId}_${key}`,
 *   "default"
 * );
 */

export function useLocalStorageState<Suffix extends string>(key: Suffix, getStorageKey: (key: string) => string, defaultValue: string): LocalPromptExample<Suffix> {
  const storageKey = getStorageKey(key);
  const [value, setValue] = useState<string | undefined>(defaultValue);

  const lsSetValue = useCallback((value: string) => {
    setValue(value);
    if (value === defaultValue) {
      safeLocalStorage.removeItem(storageKey);
    } else {
      safeLocalStorage.setItem(storageKey, value);
    }
  }, [storageKey, defaultValue]);

  const capitalizedSuffix = capitalize(key);

  useEffect(() => {
    const storedValue = safeLocalStorage.getItem(storageKey);
    if (storedValue) setValue(storedValue);
  }, [storageKey]);

  return {
    [key]: value,
    [`set${capitalizedSuffix}`]: lsSetValue,
  } as LocalPromptExample<Suffix>;
}
