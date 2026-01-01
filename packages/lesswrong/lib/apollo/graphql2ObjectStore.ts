type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonObject | JsonValue[];
export interface JsonObject {
  [key: string]: JsonValue;
}

export interface Graphql2ObjectStore {
  /**
   * Canonical key -> stored object (may itself contain {$ref} values).
   */
  objects: Map<string, JsonObject>;
  /**
   * Canonical key -> canonical JSON string for equality comparisons.
   */
  canonicalJsonByKey: Map<string, string>;
  /**
   * Base _id -> next disambiguation counter to try.
   */
  disambiguationCounterById: Map<string, number>;
}

export function createGraphql2ObjectStore(): Graphql2ObjectStore {
  return {
    objects: new Map(),
    canonicalJsonByKey: new Map(),
    disambiguationCounterById: new Map(),
  };
}

export function isRefObject(value: unknown): value is { $ref: string } {
  return (
    !!value &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    (value as any).$ref &&
    typeof (value as any).$ref === "string" &&
    Object.keys(value as any).length === 1
  );
}

function canonicalizeJson(value: JsonValue): JsonValue {
  if (value === null) return null;
  if (typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map(canonicalizeJson);

  const obj = value as JsonObject;
  const keys = Object.keys(obj).sort();
  const out: JsonObject = {};
  for (const key of keys) {
    out[key] = canonicalizeJson(obj[key]);
  }
  return out;
}

function canonicalJsonString(value: JsonValue): string {
  return JSON.stringify(canonicalizeJson(value));
}

function getDisambiguatedKey(store: Graphql2ObjectStore, baseId: string): string {
  const current = store.disambiguationCounterById.get(baseId) ?? 0;
  let n = current;
  while (true) {
    const key = `${baseId}:{${n}}`;
    if (!store.objects.has(key)) {
      store.disambiguationCounterById.set(baseId, n + 1);
      return key;
    }
    n += 1;
  }
}

function extractInner(
  value: JsonValue,
  store: Graphql2ObjectStore,
  delta: Record<string, JsonObject>,
): JsonValue {
  if (value === null) return null;
  if (typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map((v) => extractInner(v, store, delta));

  const obj = value as JsonObject;

  // First extract children so stored objects can contain refs too.
  const processed: JsonObject = {};
  for (const [k, v] of Object.entries(obj)) {
    processed[k] = extractInner(v, store, delta);
  }

  const idValue = processed._id;
  if (typeof idValue !== "string" || !idValue) {
    return processed;
  }

  const baseKey = idValue;
  const canonical = canonicalJsonString(processed);
  const existingCanonical = store.canonicalJsonByKey.get(baseKey);

  if (!existingCanonical) {
    store.objects.set(baseKey, processed);
    store.canonicalJsonByKey.set(baseKey, canonical);
    delta[baseKey] = processed;
    return { $ref: baseKey } as any;
  }

  if (existingCanonical === canonical) {
    return { $ref: baseKey } as any;
  }

  const disambiguatedKey = getDisambiguatedKey(store, baseKey);
  store.objects.set(disambiguatedKey, processed);
  store.canonicalJsonByKey.set(disambiguatedKey, canonical);
  delta[disambiguatedKey] = processed;
  return { $ref: disambiguatedKey } as any;
}

/**
 * Walks `value`, extracting any objects that have a string `_id` field into `store`.
 * Returns a substituted tree where extracted objects are replaced with `{ $ref: key }`.
 *
 * `delta` contains only the newly-added objects from this call (append-only).
 */
export function extractToObjectStoreAndSubstitute(
  value: JsonValue,
  store: Graphql2ObjectStore,
): { substituted: JsonValue; delta: Record<string, JsonObject> } {
  const delta: Record<string, JsonObject> = {};
  const substituted = extractInner(value, store, delta);
  return { substituted, delta };
}

function hydrateInner(value: JsonValue, store: Map<string, JsonObject>, seen: Set<string>): JsonValue {
  if (isRefObject(value)) {
    const key = value.$ref;
    const target = store.get(key);
    if (!target) {
      return value;
    }
    if (seen.has(key)) {
      return target;
    }
    const nextSeen = new Set(seen);
    nextSeen.add(key);
    return hydrateInner(target, store, nextSeen);
  }

  if (value === null) return null;
  if (typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map((v) => hydrateInner(v, store, seen));

  const obj = value as JsonObject;
  const out: JsonObject = {};
  for (const [k, v] of Object.entries(obj)) {
    out[k] = hydrateInner(v, store, seen);
  }
  return out;
}

/**
 * Reconstructs the original JSON tree by replacing `{ $ref: key }` objects using `store`.
 */
export function substituteFromObjectStore(
  value: JsonValue,
  store: Map<string, JsonObject>,
): JsonValue {
  return hydrateInner(value, store, new Set());
}


