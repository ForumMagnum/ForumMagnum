import ls from 'local-storage';

const defaulGetDocumentStorageId = (doc, name) => {
  const { _id, conversationId } = doc
  if (_id && name) { return {id: `${_id}${name}`, verify: true}}
  if (_id) { return {id: _id, verify: true }}
  if (conversationId) { return {id: conversationId, verify: true }}
  if (name) { return {id: name, verify: true }}
  else { throw Error("Can't get storage ID for this document:", doc)}
}

export const getLSHandlers = (getLocalStorageId = null) => {
  const idGenerator = getLocalStorageId || defaulGetDocumentStorageId
  return {
    get: ({doc, name}) => {
      const { id, verify } = idGenerator(doc, name)
      const savedState = ls.get(id)
      if (verify && savedState && Meteor.isClient && window) {
        const result = window.confirm("We've found a previously saved state for this document, would you like to restore it?")
        return result ? savedState : null
      } else {
        return savedState
      }
    },
    set: ({state, doc, name}) => {ls.set(idGenerator(doc, name).id, state)},
    reset: ({doc, name}) => {ls.remove(idGenerator(doc, name).id)}
  }
}
