export type EditableFieldName<N extends CollectionNameString> =
  keyof ObjectsByCollectionName[N] & string;

export type MakeEditableOptionsFieldName<N extends CollectionNameString> = {
  fieldName?: EditableFieldName<N>,
  normalized?: false,
} | {
  fieldName?: string,
  normalized: true,
};


export interface EditableFieldCallbackOptions {
  pingbacks: boolean;
  normalized: boolean;
}

export interface EditableFieldClientOptions {
  hasToc?: boolean,
  getLocalStorageId?: null | ((doc: any, name: string) => {id: string, verify: boolean}),
  revisionsHaveCommitMessages?: boolean,
}

export interface EditableFieldOptions {
  callbackOptions: EditableFieldCallbackOptions;
  clientOptions: EditableFieldClientOptions;
}

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
