import { useMemo, useRef } from "react";

type OrderPreservingArrayPolicy = "prepend-new" | "append-new" | "interleave-new" | "no-reorder";
type IndexType = string | number;

const arrayToIndexMap = (arr: IndexType[]): Record<IndexType, number> =>
  Object.fromEntries(
    Object.entries(arr).map(([key, val]) => [val, parseInt(key)] as const)
  );

const indexMapToArray = (map: Record<IndexType, number>): IndexType[] => {
  const unsortedKeys = Object.keys(map);
  const sortedKeys = unsortedKeys.sort((a, b) => map[a] - map[b]);
  return sortedKeys;
};

function buildOrderIndexMap<T>(
  array: T[],
  keyFunc: (elem: T) => IndexType,
  policy: OrderPreservingArrayPolicy,
  currentOrderingIndexMap: Record<IndexType, number>
): Record<IndexType, number> {
  const naiveOrdering = array.map(keyFunc);

  if (policy === "no-reorder" || Object.keys(currentOrderingIndexMap).length === 0) {
    return arrayToIndexMap(naiveOrdering);
  }

  if (policy === "append-new" || policy === "prepend-new") {
    const newElems = naiveOrdering.filter((id) => currentOrderingIndexMap[id] === undefined);
    return arrayToIndexMap([
      ...(policy === "prepend-new" ? newElems : []),
      ...indexMapToArray(currentOrderingIndexMap),
      ...(policy === "append-new" ? newElems : []),
    ]);
  }

  if (policy === "interleave-new") {
    // fill the new ordering array:
    // 1. leave new elements in the same index
    // 2. insert current elements in the order they appear in the current ordering
    const currentElems = naiveOrdering
      .filter((id) => id in currentOrderingIndexMap)
      .sort((a, b) => currentOrderingIndexMap[a] - currentOrderingIndexMap[b])
      .reverse();
    const newOrdering = naiveOrdering
      .map((elem) => (elem in currentOrderingIndexMap ? currentElems.pop() : elem)) as IndexType[];
    return arrayToIndexMap(newOrdering);
  }
  // Can't actually reach this line, but typescript can't work that out
  return arrayToIndexMap(naiveOrdering);
}

/**
 * Keeps elements that have already appeared in the array in the same order, useful for preventing reordering of elements when refetching.
 *
 * @param array
 * @param keyFunc
 * @param policy
 *  - "prepend-new": New elements are prepended to the array, existing elements are kept in the same order
 *  - "append-new": New elements are appended to the array, existing elements are kept in the same order
 *  - "interleave-new": New elements are interleaved with the existing elements (see useOrderPreservingArray.test.tsx for example)
 *  - "no-reorder": No reordering is done, useful for disabling this behavior without needing to call the hook conditionally
 * @returns
 */
export function useOrderPreservingArray<T>(
  array: T[],
  keyFunc: (elem: T) => IndexType,
  policy: OrderPreservingArrayPolicy = "interleave-new"
): T[] {
  const orderIndexMapRef = useRef<Record<IndexType, number>>({});

  orderIndexMapRef.current = useMemo(
    () => buildOrderIndexMap(array, keyFunc, policy, orderIndexMapRef.current),
    [array, keyFunc, policy]
  );

  const sortedArray = array
    .slice()
    .sort((a, b) => orderIndexMapRef.current[keyFunc(a)] - orderIndexMapRef.current[keyFunc(b)]);
  return sortedArray;
}
