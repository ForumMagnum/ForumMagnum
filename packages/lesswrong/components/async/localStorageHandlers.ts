import { isClient } from '../../lib/executionEnvironment';

export function getBrowserLocalStorage() {
  try {
    return 'localStorage' in global && (global as any).localStorage ? (global as any).localStorage : null;
  } catch(e) {
    // Some browsers don't have an accessible localStorage
    // eslint-disable-next-line no-console
    console.warn("localStorage is unavailable; posts/comments will not be autosaved");
    return null;
  }
}


// Return a wrapper around localStorage, with get, set, and reset functions
// which handle the (document, field-name, prefix) => key mapping.
export const getLSHandlers = (getLocalStorageId) => {
  return {
    get: ({doc, name, prefix}: { doc: any, name: string, prefix: string }) => {
      const { id, verify } = getLocalStorageId(doc, name)
      const ls = getBrowserLocalStorage();
      if (!ls) return null;
      
      try {
        const savedState = JSON.parse(ls.getItem(prefix+id))
        if (verify && savedState && isClient && window) {
          const result = window.confirm("We've found a previously saved state for this document, would you like to restore it?")
          return result ? savedState : null
        } else {
          return savedState
        }
      } catch(e) {
        // eslint-disable-next-line no-console
        console.warn("Failed reading from localStorage:");
        // eslint-disable-next-line no-console
        console.warn(e);
        return null;
      }
    },
    set: ({state, doc, name, prefix}: {state: any, doc: any, name: string, prefix: string}) => {
      const ls = getBrowserLocalStorage();
      if (!ls) return false;
      const id = prefix+getLocalStorageId(doc, name).id;
      
      try {
        ls.setItem(id, JSON.stringify(state))
      } catch(e) {
        // eslint-disable-next-line no-console
        console.warn("Failed writing to localStorage:");
        // eslint-disable-next-line no-console
        console.warn(e);
        return false;
      }
      return true;
    },
    reset: ({doc, name, prefix}: {doc: any, name: string, prefix: string}) => {
      const ls = getBrowserLocalStorage();
      if (!ls) return;
      const id = prefix+getLocalStorageId(doc, name).id;
      
      try {
        ls.removeItem(id)
      } catch(e) {
        // eslint-disable-next-line no-console
        console.warn("Failed writing to localStorage:");
        // eslint-disable-next-line no-console
        console.warn(e);
      }
    }
  }
}
