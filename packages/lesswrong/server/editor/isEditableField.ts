import type { EditableField } from './editableSchemaFieldHelpers';


export function isEditableField<N extends CollectionNameString>(field: [string, CollectionFieldSpecification<N>]): field is [string, EditableField<N>] {
  const { graphql } = field[1];
  return !!graphql && 'editableFieldOptions' in graphql && !!graphql.editableFieldOptions;
}
