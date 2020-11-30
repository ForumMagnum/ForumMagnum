import { isClient } from '../../lib/executionEnvironment';

function getBrowserLocalStorage() {
  try {
    return 'localStorage' in global && (global as any).localStorage ? (global as any).localStorage : null;
  } catch(e) {
    // Some browsers don't have an accessible localStorage
    // eslint-disable-next-line no-console
    console.warn("localStorage is unavailable; posts/comments will not be autosaved");
    return null;
  }
}


// Given a document and a field name, return:
// {
//   id: The name to use for storing drafts related to this document in
//     localStorage. This may be combined with an editor-type prefix.
//   verify: Whether to prompt before restoring a draft (as opposed to just
//     always restoring it).
// }
export const defaulGetDocumentStorageId = (doc, name) => {
  const { _id, conversationId } = doc
  if (_id && name) { return {id: `${_id}${name}`, verify: true}}
  if (_id) { return {id: _id, verify: true }}
  if (conversationId) { return {id: conversationId, verify: true }}
  if (name) { return {id: name, verify: true }}
  else {
    throw Error(`Can't get storage ID for this document: ${doc}`)
  }
}

// Return a wrapper around localStorage, with get, set, and reset functions
// which handle the (document, field-name, prefix) => key mapping.
export const getLSHandlers = (getLocalStorageId = null) => {
  const idGenerator = getLocalStorageId || defaulGetDocumentStorageId
  return {
    get: ({doc, name, prefix}) => {
      const { id, verify } = idGenerator(doc, name)
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
    set: ({state, doc, name, prefix}) => {
      const ls = getBrowserLocalStorage();
      if (!ls) return false;
      const id = prefix+idGenerator(doc, name).id;
      
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
    reset: ({doc, name, prefix}) => {
      const ls = getBrowserLocalStorage();
      if (!ls) return;
      const id = prefix+idGenerator(doc, name).id;
      
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
