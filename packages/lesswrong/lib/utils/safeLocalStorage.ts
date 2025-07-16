import { getBrowserLocalStorage } from '../../components/editor/localStorageHandlers';

/**
 * Safe wrapper around localStorage operations that handles errors gracefully.
 */
export const safeLocalStorage = {
  /**
   * Safely get an item from localStorage
   * @returns The stored value, or null if not found or an error occurs
   */
  getItem(key: string): string | null {
    try {
      const ls = getBrowserLocalStorage();
      return ls?.getItem(key) ?? null;
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn(`Failed to read from localStorage: ${key}`, e);
      return null;
    }
  },

  /**
   * Safely set an item in localStorage
   * @returns true if successful, false if an error occurs
   */
  setItem(key: string, value: string): boolean {
    try {
      const ls = getBrowserLocalStorage();
      if (!ls) return false;
      
      ls.setItem(key, value);
      return true;
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn(`Failed to write to localStorage: ${key}`, e);
      return false;
    }
  },

  /**
   * Safely remove an item from localStorage
   * @returns true if successful, false if an error occurs
   */
  removeItem(key: string): boolean {
    try {
      const ls = getBrowserLocalStorage();
      if (!ls) return false;
      
      ls.removeItem(key);
      return true;
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn(`Failed to remove from localStorage: ${key}`, e);
      return false;
    }
  },

  /**
   * Check if localStorage is available and working
   * @returns true if localStorage is available and we can write to it
   */
  isAvailable(): boolean {
    try {
      const ls = getBrowserLocalStorage();
      if (!ls) return false;
      
      const testKey = '__localStorage_test__';
      ls.setItem(testKey, 'test');
      ls.removeItem(testKey);
      return true;
    } catch (e) {
      return false;
    }
  }
}; 
