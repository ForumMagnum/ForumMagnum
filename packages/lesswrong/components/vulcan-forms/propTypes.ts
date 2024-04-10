/** PropTypes for documentation purpose (not tested yet) */
import PropTypes from 'prop-types';

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
  formComponents?: { FormSubmit?: any, FormGroupLayout?: any }
  
  // Wasn't in propTypes but used
  id?: string
  data?: any
  refetch?: any
  autoSubmit?: any
  formProps?: any
  
  queryFragment?: any
  mutationFragment?: any
  queryFragmentName?: FragmentName
  mutationFragmentName?: FragmentName

  documentId?: string
  slug?: string
  
  // fragment: Used externally, but may be erroneous; the internals of the forms seem to only use queryFragment and mutationFragment
  fragment?: any
  
  // version: Passed from PostsEditForm, but may be erroneous; does not seem to be used inside the forms code
  version?: "draft"
  
  alignmentForumPost?: boolean
  eventForm?: any,
  debateForm?: boolean, // note: this is an old version of debates which is deprecated in favor of collabEditorDialogue
  collabEditorDialogue?: boolean,
  extraVariables?: any
  extraVariablesValues?: any
  excludeHiddenFields?: boolean
}

export interface SmartFormProps<T extends CollectionNameString> extends WrappedSmartFormProps<T> {
  collection: CollectionBase<AnyBecauseHard>
  typeName: string
  document?: ObjectsByCollectionName[T]
  schema?: any
  createMutation?: any
  updateMutation?: any
  removeMutation?: any
  currentUser: UsersCurrent|null
}

declare global {
  type UpdateCurrentValues = (newValues: any, options?: {mode: "overwrite"|"merge"}) => Promise<void>

  interface FormComponentWrapperProps<T> {
    document: any
    name: string
    label?: string
    placeholder?: string
    input?: FormInputType
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
    currentUser?: UsersCurrent|null
    tooltip?: string
    formComponents: ComponentTypes
    locale?: string
    max?: number
    nestedInput: any
    formProps: any
    formType: "new"|"edit"
    setFooterContent?: any
  }
  interface FormComponentProps<T> extends FormComponentWrapperProps<T>{
    value: T
  }

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
