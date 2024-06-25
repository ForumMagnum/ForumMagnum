import { useCallback, useMemo } from "react"
import LRU from "lru-cache";

/**
 * Persistant cache for use inside react components.
 * If passing in `options` make sure to cache the object as a global or with
 * useMemo/useState, otherwise the cache will be destroyed and recreated on
 * every render
 */
export const useLRUCache = <Key, Value>(
  createValue: (key: Key) => Value,
  options?: Partial<LRU.Options<Key, Value>>,
) => {
  const cache = useMemo(() => {
    return new LRU<Key, Value>({
      maxAge: 1000 * 60 * 30, // 30 minute TTL
      updateAgeOnGet: false,
      max: 100,
      ...options,
    });
  }, [options]);

  const getWithCache = useCallback((key: Key) => {
    const cachedValue = cache.get(key);
    if (cachedValue !== undefined) {
      return cachedValue;
    }
    const createdValue = createValue(key);
    cache.set(key, createdValue);
    return createdValue;
  }, [cache, createValue]);

  return getWithCache;
}
