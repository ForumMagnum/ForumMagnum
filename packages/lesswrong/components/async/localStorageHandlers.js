import ls from 'local-storage';

export const commentLSHandlers = {
  get: ({doc, name}) => {
    if (doc && doc._id) { // When restoring the edit state for a specific comment, ask for permission
      const savedState = ls.get(doc._id);
      if (savedState && Meteor.isClient && window) {
        const result = window.confirm("We've found a previously saved state for this comment, would you like to restore it?")
        if (result) { return savedState }
      } else {
        return null;
      }
    } else if (doc && doc.parentCommentId) {
      return ls.get('parent:' +  doc.parentCommentId)
    } else if (doc && doc.postId) {
      return ls.get('post:' + doc.postId)
    } else {
      return null
    }
  },
  set: ({state, doc, name}) => {
    if (doc && doc._id) {
      ls.set(doc._id, state);
    } else if (doc && doc.parentCommentId) {
      ls.set('parent:' + doc.parentCommentId, state);
    } else if (doc && doc.postId, state) {
      ls.set('post:' + doc.postId, state);
    }
  },
  reset: ({doc, name}) => {
    if (doc._id) { ls.remove(doc._id) }
    else { ls.remove(name) }
  }
}

export const defaultLSHandlers = {
  get: ({doc, name}) => {
    let savedState = {};
    if (doc && doc._id) { // When restoring the edit state for a specific document, ask for permission
      savedState = ls.get(doc._id);
    } else if (doc && doc.conversationId) { // Special case for private messages
      savedState = ls.get(doc.conversationId)
    } else {
      savedState = ls.get(name);
    }
    if (savedState && Meteor.isClient && window) {
      const result = window.confirm("We've found a previously saved state for this document, would you like to restore it?")
      if (result) { return savedState }
    }
    return null;
  },
  set: ({state, doc, name}) => {
    if (doc && doc._id) {
      ls.set(doc._id, state);
    } else if (doc && doc.conversationId) {
      ls.set(doc.conversationId, state)
    } else if (name) {
      ls.set(name, state);
    }
  },
  reset: ({doc, name}) => {
    if (doc._id) { ls.remove(doc._id) }
    else if (doc.conversationId) { ls.remove(doc.conversationId) }
    else { ls.remove(name) }
  }
}
