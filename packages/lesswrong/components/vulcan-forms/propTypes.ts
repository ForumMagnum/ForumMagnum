/** PropTypes for documentation purpose (not tested yet) */
import { WatchQueryFetchPolicy } from '@apollo/client';
import PropTypes from 'prop-types';
import type { RouterLocation } from '@/lib/vulcan-lib/routes';
import type { History } from 'history'

export const fieldProps = {
  //
  defaultValue: PropTypes.any,
  help: PropTypes.string,
  description: PropTypes.string,
  // initial fields
  name: PropTypes.string,
  datatype: PropTypes.any, // ?
  layout: PropTypes.any, // string?
  input: PropTypes.any, // string, function, undefined
  options: PropTypes.object,
  // path relative to the main object
  // e.g phoneNumbers.0.value
  path: PropTypes.string,
  // permissions
  disabled: PropTypes.bool,
  // if it has an array field
  // e.g addresses.$ : { type: .... }
  arrayFieldSchema: PropTypes.object,
  arrayField: PropTypes.object, //fieldProps,
  // if it is a nested object itself
  // eg address : { type : { ... }}
  nestedSchema: PropTypes.object,
  nestedInput: PropTypes.bool, // flag
  nestedFields: PropTypes.array //arrayOf(fieldProps)
};

export const groupProps = {
  name: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  order: PropTypes.number,
  fields: PropTypes.arrayOf(PropTypes.shape(fieldProps))
};

export const callbackProps = {
  changeCallback: PropTypes.func,
  submitCallback: PropTypes.func,
  successCallback: PropTypes.func,
  removeSuccessCallback: PropTypes.func,
  errorCallback: PropTypes.func,
  cancelCallback: PropTypes.func,
  revertCallback: PropTypes.func
};

type SmartFormCallbacks = {
  changeCallback?: any
  submitCallback?: any
  successCallback?: any
  removeSuccessCallback?: any
  errorCallback?: any
  cancelCallback?: any
  revertCallback?: any
}

export type FormComponentOverridesType = {
  FormSubmit?: any
  FormGroupLayout?: any
};

export interface WrappedSmartFormProps<T extends CollectionNameString> extends SmartFormCallbacks {
  collectionName: T

  prefilledProps?: any
  layout?: string
  fields?: string[]
  addFields?: string[]
  removeFields?: string[]
  showRemove?: boolean
  submitLabel?: React.ReactNode,
  cancelLabel?: React.ReactNode,
  revertLabel?: React.ReactNode,
  repeatErrors?: boolean
  noSubmitOnCmdEnter?: boolean
  warnUnsavedChanges?: boolean
  formComponents?: FormComponentOverridesType
  
  // Wasn't in propTypes but used
  id?: string
  data?: any
  refetch?: any
  autoSubmit?: any
  formProps?: any
  
  queryFragmentName?: FragmentName
  mutationFragmentName?: FragmentName

  documentId?: string
  slug?: string
  /**
   * Warning - passing in a prefetched document into a wrapped smart form might cause unexpected issues for anything using ckEditor, if the loaded document comes back with different data than what was prefetched.
   */
  prefetchedDocument?: T extends keyof FragmentTypesByCollection ? FragmentTypes[FragmentTypesByCollection[T]] : never
    
  // version: Passed from PostsEditForm, but may be erroneous; does not seem to be used inside the forms code
  version?: "draft"
  
  alignmentForumPost?: boolean
  eventForm?: any,
  debateForm?: boolean, // note: this is an old version of debates which is deprecated in favor of collabEditorDialogue
  collabEditorDialogue?: boolean,
  extraVariables?: any
  extraVariablesValues?: any
  excludeHiddenFields?: boolean

  /**
   * Passed from PostsEditForm in cases like being redirected to the edit form after an autosave on PostsNewForm.
   * Used to provide a smoother rerender without loading states when the redirect happens, since we prefetch the relevant fragment and we know it'll be up to date when we get here
   */
  editFormFetchPolicy?: WatchQueryFetchPolicy
}

export interface SmartFormProps<T extends CollectionNameString> extends WrappedSmartFormProps<T> {
  typeName: string
  document?: ObjectsByCollectionName[T]
  schema: SchemaType<T>
  createMutation?: any
  updateMutation?: any
  removeMutation?: any
  currentUser: UsersCurrent|null
  location?: RouterLocation
  history?: History
}

declare global {
  type UpdateCurrentValues = (newValues: any, options?: {mode: "overwrite"|"merge"}) => Promise<void>

  interface FormComponentWrapperProps<T> {
    document: any
    name: string
    label?: string
    placeholder?: string
    input: FormInputType
    datatype: any
    path: string
    disabled?: boolean
    nestedSchema: any
    currentValues: any
    deletedValues: any[]
    throwError: () => void
    updateCurrentValues: UpdateCurrentValues
    errors: any[]
    addToDeletedValues: any
    clearFieldErrors: any
    tooltip?: string
    formComponents?: FormComponentOverridesType
    locale?: string
    max?: number
    nestedInput: any
    formProps: any
    formType: "new"|"edit"
    setFooterContent?: any
    hideClear?: boolean
  }
  interface FormComponentInnerWrapperProps<T> extends FormComponentWrapperProps<T> {
    beforeComponent?: any
    afterComponent?: any
    formInput: React.ComponentType<FormComponentProps<T>>
    onChange: any
    value: T
    clearField: (ev?: AnyBecauseTodo) => void
  }
  type FormComponentProps<T> = Omit<FormComponentInnerWrapperProps<T>, "input"|"formInput">

  interface FormButtonProps {
    submitLabel: React.ReactNode;
    cancelLabel: React.ReactNode;
    revertLabel: React.ReactNode;
    cancelCallback: any;
    revertCallback: any;
    submitForm: any
    updateCurrentValues: UpdateCurrentValues
    document: any;
    deleteDocument: any;
    collectionName: CollectionNameString;
    currentValues?: any
    deletedValues?: any
    errors?: any[]
    formType: "edit"|"new"
  }
  interface FormComponentContext<T> {
    updateCurrentValues: UpdateCurrentValues
    addToDeletedValues: any
  }
}
