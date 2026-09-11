import { isClient } from '../../lib/executionEnvironment';

export function getBrowserLocalStorage() {
  try {
    return 'localStorage' in global && global.localStorage ? global.localStorage : null;
  } catch(e) {
    // Some browsers don't have an accessible localStorage
    // eslint-disable-next-line no-console
    console.warn("localStorage is unavailable; posts/comments will not be autosaved");
    return null;
  }
}

export function getBrowserSessionStorage() {
  try {
    return 'sessionStorage' in global && global.sessionStorage ? global.sessionStorage : null;
  } catch {
    return null;
  }
}

/**
 * Read a value from localStorage. If this throws something, console-log it,
 * but don't let the exception escape or send it to sentry, because some amount
 * of localStorage failure is expected (especially inside of bots that execute
 * JS).
 */
export function safeStorageGetItem(storage: Storage|null|undefined, key: string): string|null {
  if (!storage) return null;
  try {
    return storage.getItem(key);
  } catch(e) {
    // eslint-disable-next-line no-console
    console.error(e);
    return null;
  }
}

/**
 * Save a value to localStorage. If this throws something, console-log it and
 * return false, but don't let the exception escape or send it to sentry,
 * because some amount of localStorage failure is expected (especially inside
 * of bots that execute JS).
 */
export function safeStorageSetItem(storage: Storage|null|undefined, key: string, value: string): boolean {
  if (!storage) return false;
  try {
    storage.setItem(key, value);
    return true;
  } catch(e) {
    // eslint-disable-next-line no-console
    console.error(e);
    return false;
  }
}

export function safeStorageRemoveItem(storage: Storage|null|undefined, key: string): boolean {
  if (!storage) return false;
  try {
    storage.removeItem(key);
    return true;
  } catch(e) {
    // eslint-disable-next-line no-console
    console.error(e);
    return false;
  }
}


// Return a wrapper around localStorage, with get, set, and reset functions
// which handle the (document, field-name, prefix) => key mapping.
export const getLSHandlers = (getLocalStorageId: (doc: any, name: string) => {id: string, verify: boolean}, doc: any, name: string, prefix: string) => {
  const { id } = getLocalStorageId(doc, name)
  const prefixedId = prefix+id;
  
  return {
    get: () => {
      const ls = getBrowserLocalStorage();
      if (!isClient || !ls) return null;
      
      try {
        const item = ls.getItem(prefixedId)
        if (item === null) {
          return null;
        }
        const savedState = JSON.parse(item)
        return savedState;
      } catch(e) {
        // eslint-disable-next-line no-console
        console.warn("Failed reading from localStorage:");
        // eslint-disable-next-line no-console
        console.warn(e);
        return null;
      }
    },
    set: (state: any) => {
      const ls = getBrowserLocalStorage();
      if (!ls) return false;
      
      try {
        ls.setItem(prefixedId, JSON.stringify(state))
      } catch(e) {
        // eslint-disable-next-line no-console
        console.warn("Failed writing to localStorage:");
        // eslint-disable-next-line no-console
        console.warn(e);
        return false;
      }
      return true;
    },
    reset: () => {
      const ls = getBrowserLocalStorage();
      if (!ls) return;
      
      try {
        ls.removeItem(prefixedId)
      } catch(e) {
        // eslint-disable-next-line no-console
        console.warn("Failed writing to localStorage:");
        // eslint-disable-next-line no-console
        console.warn(e);
      }
    }
  }
}

// Get an editor-type-specific prefix to use on localStorage keys, to prevent
// drafts written with different editors from having conflicting names.
export const getLSKeyPrefix = (editorType: string): string => {
  switch(editorType) {
    default:
    case "draftJS":  return "";
    case "markdown": return "md_";
    case "html":     return "html_";
    case "ckEditorMarkup": return "ckeditor_";
    case "lexical": return "lexical_";
  }
}
