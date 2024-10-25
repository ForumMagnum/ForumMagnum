export type EditableFieldName<N extends CollectionNameString> =
  keyof ObjectsByCollectionName[N] & string;

export type MakeEditableOptionsFieldName<N extends CollectionNameString> = {
  fieldName?: EditableFieldName<N>,
  normalized?: false,
} | {
  fieldName?: string,
  normalized: true,
};

export type MakeEditableOptions<N extends CollectionNameString> = {
  commentEditor?: boolean,
  commentStyles?: boolean,
  commentLocalStorage?: boolean,
  getLocalStorageId?: null | ((doc: any, name: string) => {id: string, verify: boolean}),
  formGroup?: any,
  permissions?: {
    canRead?: FieldPermissions,
    canUpdate?: FieldPermissions,
    // TODO: This should be FieldCreatePermissions, but there are some collections where we were passing in functions that relied on the existing object, which is a bit nonsensical
    canCreate?: AnyBecauseTodo,
  },
  label?: string,
  formVariant?: "default" | "grey",
  order?: number,
  hideControls?: boolean,
  hintText?: string,
  pingbacks?: boolean,
  revisionsHaveCommitMessages?: boolean,
  hidden?: boolean,
  hasToc?: boolean,
} & MakeEditableOptionsFieldName<N>;

export const editableCollectionsFieldOptions: Record<CollectionNameString, Record<string, MakeEditableOptions<CollectionNameString>>> = {} as any;

export const editableFieldIsNormalized = (
  collectionName: CollectionNameString,
  fieldName: string,
) => !!editableCollectionsFieldOptions[collectionName]?.[fieldName]?.normalized;
