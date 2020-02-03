import { registerCallback } from '../vulcan-lib';

registerCallback({
  name:'user.create.validate',
  iterator: {document:'the document being inserted'},
  properties: [
    { document: 'The document being inserted' },
    { currentUser: 'The current user' },
    { validationErrors: 'An object that can be used to accumulate validation errors' },
  ],
  runs: 'sync',
  returns: 'document',
  description: 'Validate a document before insertion (can be skipped when inserting directly on server).',
});
registerCallback({
  name:'user.create.before',
  iterator: {document:'the document being inserted'},
  properties: [
    { document: 'The document being inserted' },
    { currentUser: 'The current user' },
    { validationErrors: 'An object that can be used to accumulate validation errors' },
  ],
  runs: 'sync',
  returns: 'document',
  description: 'Perform operations on a new document before it\'s inserted in the database.',
});
registerCallback({
  name:'user.create.after',
  iterator: {document:'the document after being inserted in the database'},
  properties: [
    { currentUser: 'The current user' },
  ],
  runs: 'sync',
  returns: 'document',
  description: 'Perform operations on a new document after it\'s inserted in the database but *before* the mutation returns it.',
});
registerCallback({
  name:'user.create.async',
  iterator: {data:'the document after being inserted in the database'},
  properties: [
    {insertedDocument: 'The document that was inserted to the collection'},
    { currentUser: 'The current user' },
    {collection: 'The Users collection'}
  ],
  runs: 'async',
  returns: 'document',
  description: 'Perform operations on a new document after it\'s inserted in the database asynchronously.',
});
registerCallback({
  name: 'user.update.validate',
  iterator: {data: 'The client data'},
  properties: [
    {document: 'The document being updated'}, 
    {currentUser: 'The current user.'},
    {validationErrors: 'an object that can be used to accumulate validation errors.'},
  ],
  runs: 'sync',
  description: 'Validate a document before update (can be skipped when updating directly on server).'
});
registerCallback({
  name: 'user.update.before',
  iterator: {data:'The client data'},
  properties: [
    {document: 'The document being edited'},
    {currentUser: 'The current user'},
    {newDocument: 'A preview of the future document'},
  ],
  runs: 'sync',
  description: 'Perform operations on a document before it\'s updated on the database.',
});
registerCallback({
  name: 'user.update.after',
  iterator: {newdocument: 'The document after the update'},
  properties: [
    {document: 'The document before the update'},
    {currentUser: 'The current user'},
  ],
  runs: 'sync',
  description: 'Perform operations on a document after it\'s updated in the database but *before* the mutation returns it.'
});
registerCallback({
  name: 'user.update.async',
  properties: [
    {newDocument: 'The document after the update'},
    {document: 'The document before the update'},
    {currentUser: 'The current user'},
    {collection: 'The Users collection'},
  ],
  runs: 'async',
  description: 'Perform operations on a document after it\'s updated in the database asynchronously.'
});
registerCallback({
  name: 'user.delete.validate',
  iterator: {document: 'The document being deleted'},
  properties: [
    {currentUser: 'The current user'},
  ],
  runs: 'sync',
  description: 'Validate a document before deletion (can be skipped when deleting directly on the server)'
});
registerCallback({
  name: 'user.delete.before',
  iterator: {document: 'The document being deleted'},
  properties: [
    {currentUser: 'The current user'},
  ],
  runs: 'sync',
  description: 'Perform operations on a document before it\'s deleted from the database',
});
registerCallback({
  name: 'user.delete.async',
  properties:[
    {document: 'The document being deleted'},
    {currentUser: 'The current user'},
    {collection: 'The Users collection'},
  ],
  runs: 'async',
  description: 'Perform operations on a document after it\'s deleted from the database asynchronously.'
});
