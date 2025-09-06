import type { EditableFieldCallbackOptions } from '../../lib/editor/makeEditableOptions';
import { isEditableField } from './isEditableField';

export interface EditableField<N extends CollectionNameString> extends CollectionFieldSpecification<N> {
  graphql: GraphQLFieldSpecification<N> & {
    editableFieldOptions: EditableFieldCallbackOptions;
  }
};

export const getEditableFieldsByCollection = (() => {
  let editableFieldsByCollection: Partial<Record<CollectionNameString, Record<string, EditableField<CollectionNameString>>>>;
  return () => {
    if (!editableFieldsByCollection) {
      const { getAllSchemas }: typeof import('../../lib/schema/allSchemas') = require('../../lib/schema/allSchemas');
      editableFieldsByCollection = Object.entries(getAllSchemas()).reduce<Partial<Record<CollectionNameString, Record<string, EditableField<CollectionNameString>>>>>((acc, [collectionName, schema]) => {
        const editableFields = Object.entries(schema).filter(isEditableField);
        if (editableFields.length > 0) {
          acc[collectionName as CollectionNameString] = Object.fromEntries(editableFields);
        }
        return acc;
      }, {});
    }

    return editableFieldsByCollection;
  };
})();

export const getEditableCollectionNames = () => Object.keys(getEditableFieldsByCollection()) as CollectionNameString[];
export const getEditableFieldNamesForCollection = (collectionName: CollectionNameString) => Object.keys(getEditableFieldsByCollection()[collectionName] ?? {});
export const getEditableFieldInCollection = <N extends CollectionNameString>(collectionName: N, fieldName: string) => getEditableFieldsByCollection()[collectionName]?.[fieldName];
export const editableFieldIsNormalized = (collectionName: CollectionNameString, fieldName: string) => !!getEditableFieldInCollection(collectionName, fieldName)?.graphql.editableFieldOptions.normalized;
