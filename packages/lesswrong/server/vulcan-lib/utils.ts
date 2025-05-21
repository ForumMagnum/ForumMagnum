import { throwError } from './errors';

export const performCheck = async <T extends DbObject, O extends Partial<T> | Partial<DbInsertion<T>>>(
  operation: <I extends O>(user: DbUser|null, obj: I, context: any) => Promise<boolean>,
  user: DbUser|null,
  checkedObject: O,
  
  context: ResolverContext,
  documentId: string,
  operationName: string,
  collectionName: CollectionNameString
): Promise<void> => {
  if (!checkedObject) {
    throwError({ id: 'app.document_not_found', data: { documentId, operationName } });
  }

  if (!(await operation(user, checkedObject, context))) {
    throwError({ id: 'app.operation_not_allowed', data: { documentId, operationName } });
  }
};

