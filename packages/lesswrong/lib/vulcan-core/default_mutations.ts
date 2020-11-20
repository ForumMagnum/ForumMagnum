/*

Default mutations

*/

import {
  registerCallback,
  Utils,
  getTypeName,
  getCollectionName
} from '../vulcan-lib';
import { userCanDo, userOwns } from '../vulcan-users/permissions';
import isEmpty from 'lodash/isEmpty';

const defaultOptions = { create: true, update: true, upsert: true, delete: true };

/**
 * Safe getter
 * Must returns null if the document is absent (eg in case of validation failure)
 * @param {*} mutation
 * @param {*} mutationName
 */

const getCreateMutationName = (typeName: string): string => `create${typeName}`;
const getUpdateMutationName = (typeName: string): string => `update${typeName}`;
const getDeleteMutationName = (typeName: string): string => `delete${typeName}`;
const getUpsertMutationName = (typeName: string): string => `upsert${typeName}`;


export function getDefaultMutations(options:any, moreOptions?:any) {
  let typeName, collectionName, mutationOptions;

  if (typeof arguments[0] === 'object') {
    // new single-argument API
    typeName = arguments[0].typeName;
    collectionName = arguments[0].collectionName || getCollectionName(typeName);
    mutationOptions = { ...defaultOptions, ...arguments[0].options };
  } else {
    // OpenCRUD backwards compatibility
    collectionName = arguments[0];
    typeName = getTypeName(collectionName);
    mutationOptions = { ...defaultOptions, ...arguments[1] };
  }

  // register callbacks for documentation purposes
  registerCollectionCallbacks(typeName, mutationOptions);

  const mutations: any = {};

  if (mutationOptions.create) {
    // mutation for inserting a new document

    const mutationName = getCreateMutationName(typeName);

    const createMutation = {
      description: `Mutation for creating new ${typeName} documents`,
      name: mutationName,

      // check function called on a user to see if they can perform the operation
      check(user, document) {
        // OpenCRUD backwards compatibility
        const check = mutationOptions.createCheck || mutationOptions.newCheck;
        if (check) {
          return check(user, document);
        }
        // check if they can perform "foo.new" operation (e.g. "movie.new")
        // OpenCRUD backwards compatibility
        return userCanDo(user, [
          `${typeName.toLowerCase()}.create`,
          `${collectionName.toLowerCase()}.new`,
        ]);
      },

      async mutation(root, { data }, context: ResolverContext) {
        const collection = context[collectionName];

        // check if current user can pass check function; else throw error
        await Utils.performCheck(
          this.check,
          context.currentUser,
          data,
          
          context,
          '',
          `${typeName}.create`,
          collectionName
        );

        // pass document to boilerplate createMutator function
        return await Utils.createMutator({
          collection,
          data,
          currentUser: context.currentUser,
          validate: true,
          context,
        });
      },
    };
    mutations.create = createMutation;
    // OpenCRUD backwards compatibility
    mutations.new = createMutation;
  }

  if (mutationOptions.update) {
    // mutation for editing a specific document

    const mutationName = getUpdateMutationName(typeName);

    const updateMutation = {
      description: `Mutation for updating a ${typeName} document`,
      name: mutationName,

      // check function called on a user and document to see if they can perform the operation
      check(user, document) {
        // OpenCRUD backwards compatibility
        const check = mutationOptions.updateCheck || mutationOptions.editCheck;
        if (check) {
          return check(user, document);
        }

        if (!user || !document) return false;
        // check if user owns the document being edited.
        // if they do, check if they can perform "foo.edit.own" action
        // if they don't, check if they can perform "foo.edit.all" action
        // OpenCRUD backwards compatibility
        return userOwns(user, document)
          ? userCanDo(user, [
            `${typeName.toLowerCase()}.update.own`,
            `${collectionName.toLowerCase()}.edit.own`,
          ])
          : userCanDo(user, [
            `${typeName.toLowerCase()}.update.all`,
            `${collectionName.toLowerCase()}.edit.all`,
          ]);
      },

      async mutation(root, { selector, data }, context: ResolverContext) {
        const collection = context[collectionName];

        if (isEmpty(selector)) {
          throw new Error('Selector cannot be empty');
        }

        // get entire unmodified document from database
        const document = await Utils.Connectors.get(collection, selector);

        if (!document) {
          throw new Error(
            `Could not find document to update for selector: ${JSON.stringify(selector)}`
          );
        }

        // check if user can perform operation; if not throw error
        await Utils.performCheck(
          this.check,
          context.currentUser,
          document,
          
          context,
          document._id,
          `${typeName}.update`,
          collectionName
        );

        // call updateMutator boilerplate function
        return await Utils.updateMutator({
          collection,
          selector,
          data,
          currentUser: context.currentUser,
          validate: true,
          context,
          document,
        });
      },
    };

    mutations.update = updateMutation;
    // OpenCRUD backwards compatibility
    mutations.edit = updateMutation;

  }
  if (mutationOptions.upsert) {
    // mutation for upserting a specific document
    const mutationName = getUpsertMutationName(typeName);
    mutations.upsert = {
      description: `Mutation for upserting a ${typeName} document`,
      name: mutationName,

      async mutation(root, { selector, data }, context) {
        const collection = context[collectionName];

        // check if document exists already
        const existingDocument = await Utils.Connectors.get(collection, selector, {
          fields: { _id: 1 },
        });

        if (existingDocument) {
          return await collection.options.mutations.update.mutation(
            root,
            { selector, data },
            context
          );
        } else {
          return await collection.options.mutations.create.mutation(root, { data }, context);
        }
      },
    };
  }
  if (mutationOptions.delete) {
    // mutation for removing a specific document (same checks as edit mutation)

    const mutationName = getDeleteMutationName(typeName);

    const deleteMutation = {
      description: `Mutation for deleting a ${typeName} document`,
      name: mutationName,

      check(user, document) {
        // OpenCRUD backwards compatibility
        const check = mutationOptions.deleteCheck || mutationOptions.removeCheck;
        if (check) {
          return check(user, document);
        }

        if (!user || !document) return false;
        // OpenCRUD backwards compatibility
        return userOwns(user, document)
          ? userCanDo(user, [
            `${typeName.toLowerCase()}.delete.own`,
            `${collectionName.toLowerCase()}.remove.own`,
          ])
          : userCanDo(user, [
            `${typeName.toLowerCase()}.delete.all`,
            `${collectionName.toLowerCase()}.remove.all`,
          ]);
      },

      async mutation(root, { selector }, context) {
        const collection = context[collectionName];

        if (isEmpty(selector)) {
          throw new Error('Selector cannot be empty');
        }

        const document = await Utils.Connectors.get(collection, selector);

        if (!document) {
          throw new Error(
            `Could not find document to delete for selector: ${JSON.stringify(selector)}`
          );
        }

        await Utils.performCheck(
          this.check,
          context.currentUser,
          document,
          context,
          document._id,
          `${typeName}.delete`,
          collectionName
        );

        return await Utils.deleteMutator({
          collection,
          selector,
          currentUser: context.currentUser,
          validate: true,
          context,
          document,
        });
      },
    };

    mutations.delete = deleteMutation;
    // OpenCRUD backwards compatibility
    mutations.remove = deleteMutation;

  }

  return mutations;
}

const registerCollectionCallbacks = (typeName, options) => {
  typeName = typeName.toLowerCase();

  if (options.create) {
    registerCallback({
      name: `${typeName}.create.validate`,
      iterator: { validationErrors: 'An array that can be used to accumulate validation errors' },
      properties: [
        { document: 'The document being inserted' },
        { currentUser: 'The current user' },
        { collection: 'The collection the document belongs to' },
        { context: 'The context of the mutation' },
      ],
      runs: 'sync',
      returns: 'document',
      description:
        'Validate a document before insertion (can be skipped when inserting directly on server).',
    });
    registerCallback({
      name: `${typeName}.create.before`,
      iterator: { document: 'The document being inserted' },
      properties: [{ currentUser: 'The current user' }],
      runs: 'sync',
      returns: 'document',
      description: "Perform operations on a new document before it's inserted in the database.",
    });
    registerCallback({
      name: `${typeName}.create.after`,
      iterator: { document: 'The document being inserted' },
      properties: [{ currentUser: 'The current user' }],
      runs: 'sync',
      returns: 'document',
      description:
        "Perform operations on a new document after it's inserted in the database but *before* the mutation returns it.",
    });
    registerCallback({
      name: `${typeName}.create.async`,
      iterator: { document: 'The document being inserted' },
      properties: [
        { currentUser: 'The current user' },
        { collection: 'The collection the document belongs to' },
      ],
      runs: 'async',
      returns: null,
      description:
        "Perform operations on a new document after it's inserted in the database asynchronously.",
    });
  }
  if (options.update) {
    registerCallback({
      name: `${typeName}.update.validate`,
      iterator: { validationErrors: 'An object that can be used to accumulate validation errors' },
      properties: [
        { document: 'The document being edited' },
        { data: 'The client data' },
        { currentUser: 'The current user' },
        { collection: 'The collection the document belongs to' },
        { context: 'The context of the mutation' },
      ],
      runs: 'sync',
      returns: 'modifier',
      description:
        'Validate a document before update (can be skipped when updating directly on server).',
    });
    registerCallback({
      name: `${typeName}.update.before`,
      iterator: { data: 'The client data' },
      properties: [{ document: 'The document being edited' }, { currentUser: 'The current user' }],
      runs: 'sync',
      returns: 'modifier',
      description: "Perform operations on a document before it's updated in the database.",
    });
    registerCallback({
      name: `${typeName}.update.after`,
      iterator: { newDocument: 'The document after the update' },
      properties: [{ document: 'The document being edited' }, { currentUser: 'The current user' }],
      runs: 'sync',
      returns: 'document',
      description:
        "Perform operations on a document after it's updated in the database but *before* the mutation returns it.",
    });
    registerCallback({
      name: `${typeName}.update.async`,
      iterator: { newDocument: 'The document after the edit' },
      properties: [
        { document: 'The document before the edit' },
        { currentUser: 'The current user' },
        { collection: 'The collection the document belongs to' },
      ],
      runs: 'async',
      returns: null,
      description:
        "Perform operations on a document after it's updated in the database asynchronously.",
    });
  }
  if (options.delete) {
    registerCallback({
      name: `${typeName}.delete.validate`,
      iterator: { validationErrors: 'An object that can be used to accumulate validation errors' },
      properties: [
        { currentUser: 'The current user' },
        { document: 'The document being removed' },
        { collection: 'The collection the document belongs to' },
        { context: 'The context of this mutation' },
      ],
      runs: 'sync',
      returns: 'document',
      description:
        'Validate a document before removal (can be skipped when removing directly on server).',
    });
    registerCallback({
      name: `${typeName}.delete.before`,
      iterator: { document: 'The document being removed' },
      properties: [{ currentUser: 'The current user' }],
      runs: 'sync',
      returns: null,
      description: "Perform operations on a document before it's removed from the database.",
    });
    registerCallback({
      name: `${typeName}.delete.async`,
      properties: [
        { document: 'The document being removed' },
        { currentUser: 'The current user' },
        { collection: 'The collection the document belongs to' },
      ],
      runs: 'async',
      returns: null,
      description:
        "Perform operations on a document after it's removed from the database asynchronously.",
    });
  }
};
