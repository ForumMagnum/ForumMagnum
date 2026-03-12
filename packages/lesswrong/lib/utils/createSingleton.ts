
export function createSingleton<T>(get: () => T): () => T {
  let value: T|null = null;
  return () => {
    if (value !== null) {
      return value;
    } else {
      value = get();
      return value;
    }
  }
}
