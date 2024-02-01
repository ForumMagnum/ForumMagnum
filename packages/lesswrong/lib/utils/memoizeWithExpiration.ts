
export function memoizeWithExpiration<T>(recompute: () => T, timeout: number): {
  get: () => T
} {
  let cachedValue: { value: T, expiresAt: number }|null = null;
  
  return {
    get: () => {
      const now = new Date().getTime();
      if (!cachedValue || now > cachedValue.expiresAt) {
        cachedValue = {
          value: recompute(),
          expiresAt: now+timeout,
        };
      }
      return cachedValue.value;
    }
  };
}
