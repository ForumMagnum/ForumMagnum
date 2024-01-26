// Sometimes 100 posts generate more index requests than algolia will willingly
// handle - split them up in that case
// NOTE: 2023-12-07 - is this still needed now we use Elasticsearch?
export function subBatchArray<T>(arr: Array<T>, maxSize: number): Array<Array<T>> {
  const result: Array<Array<T>> = []
  while (arr.length > 0) {
    result.push(arr.slice(0, maxSize))
    arr = arr.slice(maxSize, arr.length)
  }
  return result
}
