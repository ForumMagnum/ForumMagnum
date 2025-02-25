import { convertDocumentIdToIdInSelector, Utils } from '../vulcan-lib/utils';
import { collectionNameToGraphQLType } from '../vulcan-lib/collections';
import { userCanDo, userOwns } from '../vulcan-users/permissions';
import isEmpty from 'lodash/isEmpty';
import { loggerConstructor } from '../utils/logging';

export interface MutationOptions<T extends DbObject> {
  newCheck?: (user: DbUser|null, document: T|null) => Promise<boolean>|boolean,
  editCheck?: (user: DbUser|null, document: T|null) => Promise<boolean>|boolean,
  removeCheck?: (user: DbUser|null, document: T|null) => Promise<boolean>|boolean,
  create?: boolean,
  update?: boolean,
  upsert?: boolean,
  delete?: boolean,
}

const defaultOptions = { create: true, update: true, upsert: true, delete: true };

const getCreateMutationName = (typeName: string): string => `create${typeName}`;
const getUpdateMutationName = (typeName: string): string => `update${typeName}`;
const getDeleteMutationName = (typeName: string): string => `delete${typeName}`;
const getUpsertMutationName = (typeName: string): string => `upsert${typeName}`;

export function getDefaultMutations<N extends CollectionNameString>(collectionName: N, options?: MutationOptions<ObjectsByCollectionName[N]>) {
  type T = ObjectsByCollectionName[N];
  const typeName = collectionNameToGraphQLType(collectionName);
  const mutationOptions: MutationOptions<T> = {...defaultOptions, ...options};
  const logger = loggerConstructor(`mutations-${collectionName.toLowerCase()}`)

  const mutations: DefaultMutations<T> = {};

  if (mutationOptions.create) {
    // mutation for inserting a new document

    const mutationName = getCreateMutationName(typeName);

    const createMutation = {
      description: `Mutation for creating new ${typeName} documents`,
      name: mutationName,

      // check function called on a user to see if they can perform the operation
      async check(user: DbUser|null, document: T|null): Promise<boolean> {
        // OpenCRUD backwards compatibility
        const check = mutationOptions.newCheck;
        if (check) {
          return await check(user, document);
        }
        // check if they can perform "foo.new" operation (e.g. "movie.new")
        // OpenCRUD backwards compatibility
        return userCanDo(user, [
          `${typeName.toLowerCase()}.create`,
          `${collectionName.toLowerCase()}.new`,
        ]);
      },

      async mutation(root: void, { data }: AnyBecauseTodo, context: ResolverContext) {
        const startMutate = Date.now()
        logger('create mutation()')
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
        const returnValue = await Utils.createMutator({
          collection,
          document: data,
          currentUser: context.currentUser,
          validate: true,
          context,
        });
        const timeElapsed = Date.now() - startMutate
        // Temporarily disabled to investigate performance issues
        // captureEvent("mutationCompleted", {mutationName, timeElapsed, documentId: returnValue.data._id}, true)
        return returnValue;
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
      async check(user: DbUser|null, document: T|null) {
        // OpenCRUD backwards compatibility
        const check = mutationOptions.editCheck;
        if (check) {
          return await check(user, document);
        }

        if (!user || !document) return false;
        // check if user owns the document being edited.
        // if they do, check if they can perform "foo.edit.own" action
        // if they don't, check if they can perform "foo.edit.all" action
        // OpenCRUD backwards compatibility
        return userOwns(user, document as HasUserIdType)
          ? userCanDo(user, [
            `${typeName.toLowerCase()}.update.own`,
            `${collectionName.toLowerCase()}.edit.own`,
          ])
          : userCanDo(user, [
            `${typeName.toLowerCase()}.update.all`,
            `${collectionName.toLowerCase()}.edit.all`,
          ]);
      },

      async mutation(root: void, { selector, data }: AnyBecauseTodo, context: ResolverContext) {
        logger('update mutation()')
        const collection = context[collectionName] as CollectionBase<N>;

        if (isEmpty(selector)) {
          throw new Error('Selector cannot be empty');
        }

        // get entire unmodified document from database
        const document = await collection.findOne(convertDocumentIdToIdInSelector(selector));

        if (!document) {
          throw new Error(
            `Could not find document to update for selector: ${JSON.stringify(selector)}`
          );
        }

        // check if user can perform operation; if not throw error
        await Utils.performCheck<T>(
          this.check,
          context.currentUser,
          document,
          
          context,
          document._id,
          `${typeName}.update`,
          collectionName
        );

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

      async mutation(root: void, { selector, data }: {
        selector: MongoSelector<T>
        data: AnyBecauseTodo
      }, context: ResolverContext) {
        const collection = context[collectionName] as CollectionBase<N>;

        // check if document exists already
        const convertedSelector: MongoSelector<T> = convertDocumentIdToIdInSelector(selector);
        const projection = {_id: 1} as MongoProjection<T>;
        const existingDocument = await collection.findOne(convertedSelector, {}, projection);

        if (existingDocument) {
          return await collection.options.mutations?.update?.mutation(
            root,
            { selector, data },
            context
          );
        } else {
          return await collection.options.mutations?.create?.mutation(root, { data }, context);
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

      async check(user: DbUser|null, document: T|null) {
        // OpenCRUD backwards compatibility
        const check = mutationOptions.removeCheck;
        if (check) {
          return await check(user, document);
        }

        if (!user || !document) return false;
        // OpenCRUD backwards compatibility
        return userOwns(user, document as HasUserIdType)
          ? userCanDo(user, [
            `${typeName.toLowerCase()}.delete.own`,
            `${collectionName.toLowerCase()}.remove.own`,
          ])
          : userCanDo(user, [
            `${typeName.toLowerCase()}.delete.all`,
            `${collectionName.toLowerCase()}.remove.all`,
          ]);
      },

      async mutation(root: void, { selector }: AnyBecauseTodo, context: ResolverContext) {
        logger('delete mutation()')
        const collection = context[collectionName] as CollectionBase<N>;

        if (isEmpty(selector)) {
          throw new Error('Selector cannot be empty');
        }

        const document = await collection.findOne(convertDocumentIdToIdInSelector(selector));

        if (!document) {
          throw new Error(
            `Could not find document to delete for selector: ${JSON.stringify(selector)}`
          );
        }

        await Utils.performCheck<T>(
          this.check,
          context.currentUser,
          document,
          context,
          document._id,
          `${typeName}.delete`,
          collectionName
        );

        // TODO: A problem with deleteMutator types means that it demands a
        // documentId instead of a selector
        // @ts-ignore
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
