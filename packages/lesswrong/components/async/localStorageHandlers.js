import ls from 'local-storage';

// Given a document and a field name, return:
// {
//   id: The name to use for storing drafts related to this document in
//     localStorage. This may be combined with an editor-type prefix.
//   verify: Whether to prompt before restoring a draft (as opposed to just
//     always restoring it).
// }
const defaulGetDocumentStorageId = (doc, name) => {
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
      const savedState = ls.get(prefix+id)
      if (verify && savedState && Meteor.isClient && window) {
        const result = window.confirm("We've found a previously saved state for this document, would you like to restore it?")
        return result ? savedState : null
      } else {
        return savedState
      }
    },
    set: ({state, doc, name, prefix}) => {
      const id = prefix+idGenerator(doc, name).id;
      ls.set(id, state)
    },
    reset: ({doc, name, prefix}) => {
      const id = prefix+idGenerator(doc, name).id;
      ls.remove(id)
    }
  }
}
