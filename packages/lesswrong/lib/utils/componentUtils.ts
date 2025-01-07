
export function debugShouldComponentUpdate(description: string, log: (message: string) => void, oldProps: any, oldState: any, nextProps: any, nextState: any)
{
  for(let key in nextState) {
    if(oldState[key] !== nextState[key]) {
      log(`Updating ${description} because state.${key} changed`);
      return true;
    }
  }

  let changedProps: Array<any> = [];
  for(let key in nextProps) {
    if(nextProps[key] !== oldProps[key])
      changedProps.push(key);
  }
  if(changedProps.length > 0) {
    log(`Updating ${description} because props.[${changedProps.join(", ")}] changed`);
    return true;
  } else {
    return false;
  }
}

// Do a shallow comparison between two objects. Returns true if a[k]===b[k] for
// every key k, and both objects have the same set of keys.
export function shallowEqual(a: any, b: any) {
  if (!a && !b) { return true; }
  if ((!a && b) || (a && !b)) { return false; }

  let numKeysA = 0, numKeysB = 0, key;
  for (key in b) {
    numKeysB++;
    if (!a.hasOwnProperty(key) || (a[key] !== b[key])) {
      return false;
    }
  }
  for (key in a) {
    numKeysA++;
  }
  return numKeysA === numKeysB;
}

// Do a shallow comparison between two objects, ignoring a set of keys which
// may differ without making the objects count as unequal. Returns true if
// a[k]===b[k] for every key k not in ignoredKeys, and both objects have the
// same set of keys.
export function shallowEqualExcept(a: any, b: any, ignoredKeys: Array<string>) {
  if (!a && !b) { return true; }
  if ((!a && b) || (a && !b)) { return false; }

  let numKeysA = 0, numKeysB = 0, key;
  for (key in b) {
    numKeysB++;
    let ignoreKey = false;
    for(var i=0; i<ignoredKeys.length; i++) {
      if(ignoredKeys[i] === key) {
        ignoreKey = true;
        break;
      }
    }
    if (!ignoreKey && (!a.hasOwnProperty(key) || (a[key] !== b[key]))) {
      return false;
    }
  }
  for (key in a) {
    numKeysA++;
  }
  return numKeysA === numKeysB;
}
