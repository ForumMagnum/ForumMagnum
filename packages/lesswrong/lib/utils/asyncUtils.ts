

/// Like _.filter, but with an async filter function. Given an array and an async function, return
/// an array containing the subset of the original array for which the filter returns true, in the
/// same order. Filters will be run on array elements in parallel (to the extent async is parallel).
/// This function assumes that the array is not modified in the background, and that the filter
/// doesn't care about execution order.
export const asyncFilter = async <T>(list: Array<T>, filter: (x:T)=>Promise<boolean>): Promise<Array<T>> => {
  const filterPromises: Array<Promise<boolean>> = list.map(filter);
  const filterMatches: Array<boolean> = await Promise.all(filterPromises);
  
  let result: Array<T> = [];
  for (let i=0; i<filterMatches.length; i++) {
    if (filterMatches[i])
      result.push(list[i]);
  }
  return result;
}

