import { ACCESS_FILTERED } from "@/lib/utils/schemaUtils";
import { UpdateSelector, convertDocumentIdToIdInSelector } from "@/lib/vulcan-lib/utils";
import isEmpty from "lodash/isEmpty";
import { throwError } from "../errors";

interface CreateMutationOptions<D, T extends DbObject, R extends { [ACCESS_FILTERED]: true } | null> {
  newCheck: (user: DbUser | null, document: D | null, context: ResolverContext) => Promise<boolean> | boolean,
  accessFilter: (rawResult: T, context: ResolverContext) => Promise<R>,
}

interface UpdateMutationOptions<T extends DbObject, R extends { [ACCESS_FILTERED]: true } | null> {
  editCheck: (user: DbUser | null, document: T | null, context: ResolverContext) => Promise<boolean> | boolean,
  accessFilter: (rawResult: T, context: ResolverContext) => Promise<R>,
}

export function wrapCreateMutatorFunction<
  D,
  T extends (args: { data: D }, context: ResolverContext, skipValidation?: boolean) => Promise<any>,
  O extends CreateMutationOptions<D, Awaited<ReturnType<T>>, R>,
  R extends { [ACCESS_FILTERED]: true } | null
>(func: T, options: O) {
  return async (root: void, args: Parameters<T>[0], context: ResolverContext) => {
    const { newCheck, accessFilter } = options;
    if (!(await newCheck(context.currentUser, args.data, context))) {
      throwError({ id: 'app.operation_not_allowed' });
    }

    const rawResult = await func(args, context);
    const filteredResult = await accessFilter(rawResult, context);
    return { data: filteredResult };
  };
}

export function wrapUpdateMutatorFunction<
  N extends CollectionNameString,
  D,
  T extends (args: { selector: SelectorInput, data: D }, context: ResolverContext, skipValidation?: boolean) => Promise<any>,
  O extends UpdateMutationOptions<ObjectsByCollectionName[N], R>,
  R extends { [ACCESS_FILTERED]: true } | null
>(collectionName: N, func: T, options: O) {
  return async (root: void, args: Parameters<T>[0], context: ResolverContext) => {
    const { editCheck, accessFilter } = options;
    const { loaders, currentUser } = context;
    const { selector } = args;

    if (isEmpty(selector)) {
      throw new Error('Selector cannot be empty');
    }

    // get entire unmodified document from database
    const documentSelector = convertDocumentIdToIdInSelector(selector as UpdateSelector);
    const oldDocument = await loaders[collectionName].load(documentSelector._id);

    if (!oldDocument) {
      throwError({ id: 'app.document_not_found', data: { documentId: documentSelector._id } });
    }

    if (!(await editCheck(currentUser, oldDocument, context))) {
      throwError({ id: 'app.operation_not_allowed', data: { documentId: documentSelector._id } });
    }
    
    const rawResult = await func(args, context);
    const filteredResult = await accessFilter(rawResult, context);
    return { data: filteredResult };
  };
}
