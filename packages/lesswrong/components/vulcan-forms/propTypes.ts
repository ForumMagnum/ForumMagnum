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

export interface SmartFormProps extends SmartFormCallbacks {
  collection?: any
  collectionName?: any
  typeName?: string
  document?: any
  schema?: any

  createMutation?: any
  updateMutation?: any
  removeMutation?: any

  prefilledProps?: any
  layout?: string
  fields?: string[]
  addFields?: string[]
  removeFields?: string[]
  hideFields?: string[]
  showRemove?: boolean
  submitLabel?: React.ReactNode,
  cancelLabel?: React.ReactNode,
  revertLabel?: React.ReactNode,
  repeatErrors?: boolean
  noSubmitOnCmdEnter?: boolean
  warnUnsavedChanges?: boolean
  formComponents?: any
  
  // Wasn't in propTypes but used
  id?: string
  data?: any
  refetch?: any
  autoSubmit?: any
  formProps?: any
  
  queryFragment?: any
  mutationFragment?: any
  queryFragmentName?: any
  mutationFragmentName?: any

  documentId?: any
  slug?: any
  
  // fragment: Used externally, but may be erroneous; the internals of the forms seem to only use queryFragment and mutationFragment
  fragment?: any
  
  // version: Passed from PostsEditForm, but may be erroneous; does not seem to be used inside the forms code
  version?: "draft"
  
  alignmentForumPost?: any
  eventForm?: any,
  extraVariables?: any
  extraVariablesValues?: any
  excludeHiddenFields?: boolean

  // Provided by HoCs in wrappers
  history?: any
  currentUser?: UsersCurrent|null
}

declare global {
  interface FormComponentProps<T> {
    name: string
    label?: string
    placeholder?: string
    disabled?: boolean
    path: string
    value: T
    document: any
    updateCurrentValues: (newValues: any)=>void
    formType: "edit"|"new"
  }
  interface FormComponentContext<T> {
    updateCurrentValues: (newValues: any)=>void
  }
}
