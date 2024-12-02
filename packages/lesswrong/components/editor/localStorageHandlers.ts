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


// Return a wrapper around localStorage, with get, set, and reset functions
// which handle the (document, field-name, prefix) => key mapping.
export const getLSHandlers = (getLocalStorageId: any, doc: any, name: string, prefix: string) => {
  const { id, verify } = getLocalStorageId(doc, name)
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
  }
}
