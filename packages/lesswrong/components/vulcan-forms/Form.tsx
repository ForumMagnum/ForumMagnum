import cloneDeep from 'lodash/cloneDeep';
import compact from 'lodash/compact';
import find from 'lodash/find';
import get from 'lodash/get';
import isEqual from 'lodash/isEqual';
import isEqualWith from 'lodash/isEqualWith';
import isObject from 'lodash/isObject';
import mapValues from 'lodash/mapValues';
import merge from 'lodash/merge';
import pick from 'lodash/pick';
import pickBy from 'lodash/pickBy';
import set from 'lodash/set';
import uniq from 'lodash/uniq';
import uniqBy from 'lodash/uniqBy';
import unset from 'lodash/unset';
import update from 'lodash/update';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import SimpleSchema from 'simpl-schema';
import * as _ from 'underscore';
import { getParentPath } from '../../lib/vulcan-forms/path_utils';
import { convertSchema, formProperties, getEditableFields, getInsertableFields } from '../../lib/vulcan-forms/schema_utils';
import { isEmptyValue } from '../../lib/vulcan-forms/utils';
import { removeProperty } from '../../lib/vulcan-lib/utils';
import { callbackProps, SmartFormProps } from './propTypes';
import { filterNonnull, isFunction } from '../../lib/utils/typeGuardUtils';
import { formatLabel, formatMessage } from '../../lib/vulcan-i18n/provider';
import classNames from 'classnames';
import { runCallbacksList } from './runCallbacksList';
import { getErrors } from "../../lib/vulcan-lib/errors";
import { Components } from "../../lib/vulcan-lib/components";

/** FormField in the process of being created */
type FormFieldUnfinished<N extends CollectionNameString> = Partial<FormField<N>>

// props that should trigger a form reset
const RESET_PROPS = [
  'collectionName', 'typeName', 'document', 'schema', 'currentUser',
  'fields', 'removeFields',
  // `prefilledProps` is handled slightly differently - all the other props
  // trigger a full reset of the form, but changed to `prefilledProps` are
  // merged into the current document with `updateCurrentValues`.
  'prefilledProps'
] as const;

const compactParent = (object: AnyBecauseTodo, path: AnyBecauseTodo) => {
  const parentPath = getParentPath(path);

  // note: we only want to compact arrays, not objects
  const compactIfArray = (x: AnyBecauseTodo) => (Array.isArray(x) ? compact(x) : x);

  update(object, parentPath, compactIfArray);
};

const getDefaultValues = (convertedSchema: AnyBecauseTodo) => {
  // TODO: make this work with nested schemas, too
  return pickBy(
    mapValues(convertedSchema, field => field.defaultValue),
    value => value
  );
};

const getInitialStateFromProps = <T extends DbObject>(nextProps: SmartFormProps<CollectionNameOfObject<T>>): FormState => {
  // TODO: figure out why it doesn't like the type assignment
  // In practice, it was working fine before I fixed the type of the schema field in the props
  const schema = new SimpleSchema(nextProps.schema as AnyBecauseHard);
  const convertedSchema = convertSchema(schema as any)!;
  const formType = nextProps.document ? 'edit' : 'new';
  // for new document forms, add default values to initial document
  const defaultValues =
    formType === 'new' ? getDefaultValues(convertedSchema) : {};
  const initialDocument = merge(
    {},
    defaultValues,
    nextProps.prefilledProps||{},
    nextProps.document
  );

  //if minCount is specified, go ahead and create empty nested documents
  Object.keys(convertedSchema).forEach(key => {
    let minCount = convertedSchema[key].minCount;
    if (minCount) {
      initialDocument[key] = initialDocument[key] || [];
      while (initialDocument[key].length < minCount)
        initialDocument[key].push({});
    }
  });

  // remove all instances of the `__typename` property from document
  removeProperty(initialDocument, '__typename');

  return {
    disabled: false,
    errors: [],
    deletedValues: [],
    currentValues: {},
    // convert SimpleSchema schema into JSON object
    // TODO: type convertedSchema
    schema: convertedSchema,
    // Also store all field schemas (including nested schemas) in a flat structure
    flatSchema: convertSchema(schema as any, true),
    // the initial document passed as props
    initialDocument,
    // initialize the current document to be the same as the initial document
    currentDocument: initialDocument
  };
};

interface FormState {
  disabled: boolean,
  errors: any[],
  deletedValues: any[],
  currentValues: any,
  schema: any,
  flatSchema: any
  initialDocument: any,
  currentDocument: any
}

/**
 * Main form component. Should not be used directly; use only through
 * WrappedSmartForm. Depending whether this is a new form or an edit form,
 * FormWrapper will have provided a create mutator, document and/or update
 * mutator.
 *
 * This is not in the Components table and is not registered with
 * registerComponent because you aren't supposed to use it without FormWrapper.
 */
export class Form<N extends CollectionNameString> extends Component<SmartFormProps<N>,FormState> {
  constructor(props: SmartFormProps<N>) {
    super(props);

    this.formRef = React.createRef<HTMLFormElement>();
    this.state = {
      ...getInitialStateFromProps(props)
    };
  }

  formRef: React.RefObject<HTMLFormElement>
  unblock: any
  
  defaultValues: any = {};

  submitFormCallbacks: Array<any> = [];
  successFormCallbacks: Array<any> = [];
  failureFormCallbacks: Array<any> = [];

  // --------------------------------------------------------------------- //
  // ------------------------------- Helpers ----------------------------- //
  // --------------------------------------------------------------------- //

  /** If a document is being passed, this is an edit form */
  getFormType = () => {
    return this.props.document ? 'edit' : 'new';
  };

  /** Get a list of all insertable fields */
  getInsertableFields = (schema: SchemaType<N>) => {
    return getInsertableFields(
      schema || this.state.schema,
      this.props.currentUser??null
    );
  };

  /** Get a list of all editable fields */
  getEditableFields = (schema: SchemaType<N>) => {
    return getEditableFields(
      schema || this.state.schema,
      this.props.currentUser??null,
      this.state.initialDocument
    );
  };

  /** Get a list of all mutable (insertable/editable depending on current form type) fields */
  getMutableFields = (schema: SchemaType<N>) => {
    return this.getFormType() === 'edit'
      ? this.getEditableFields(schema)
      : this.getInsertableFields(schema);
  };

  /** Get the current document */
  getDocument = () => {
    return this.state.currentDocument;
  };

  /**
   * Like getDocument, but cross-reference with getFieldNames()
   * to only return fields that actually need to be submitted
   *
   * Also remove any deleted values.
   */
  getData = async (customArgs: AnyBecauseTodo) => {
    // we want to keep prefilled data even for hidden/removed fields
    const args = {
      excludeRemovedFields: false,
      excludeHiddenFields: false,
      addExtraFields: false,
      ...customArgs
    };

    // only keep relevant fields
    const fields = this.getFieldNames(args);
    let data = pick(this.getDocument(), ...fields);

    // compact deleted values
    this.state.deletedValues.forEach(path => {
      if (path.includes('.')) {
        /*

        If deleted field is a nested field, nested array, or nested array item, try to compact its parent array

        - Nested field: 'address.city'
        - Nested array: 'addresses.1'
        - Nested array item: 'addresses.1.city'

        */
        compactParent(data, path);
      }
    });

    // run data object through submitForm callbacks
    data = await runCallbacksList({
      callbacks: this.submitFormCallbacks,
      iterator: data,
      properties: [this],
    });

    return data;
  };

  // --------------------------------------------------------------------- //
  // -------------------------------- Fields ----------------------------- //
  // --------------------------------------------------------------------- //

  /**
   * Get all field groups
   */
  getFieldGroups = (): FormGroupType<N>[] => {
    let mutableFields = this.getMutableFields(this.state.schema);
    // build fields array by iterating over the list of field names
    let fields = this.getFieldNames(this.props).map((fieldName: string) => {
      // get schema for the current field
      return this.createField(fieldName, this.state.schema, mutableFields);
    });

    fields = _.sortBy(fields, 'order');

    // get list of all unique groups (based on their name) used in current fields
    const fieldGroupGetters = filterNonnull(fields.map(field => field.group));
    const deduplicatedGroups = uniqBy(
      fieldGroupGetters.map(group => group()),
      (group) => group.name
    );

    // for each group, add relevant fields
    const groups = deduplicatedGroups.map(group => {
      group.label = group.label || formatMessage({ id: group.name });
      group.fields = fields.filter(field => {
        return field.group && field.group.name === group.name;
      })
      return group;
    });
    
    // add default group
    groups.unshift({
      name: 'default',
      label: 'default',
      order: 0,
      fields: _.filter(fields, field => {
        return !field.group;
      })
    });

    // sort by order
    return _.sortBy(groups, 'order');
  };

  /**
   * Get a list of the fields to be included in the current form
   *
   * Note: when submitting the form (getData()), do not include any extra fields
   */
  getFieldNames = (args?: any) => {
    // we do this to avoid having default values in arrow functions, which breaks MS Edge support. See https://github.com/meteor/meteor/issues/10171
    let args0 = args || {};
    const {
      schema = this.state.schema,
      excludeHiddenFields = true,
      excludeRemovedFields = true,
      addExtraFields = true
    } = args0;

    const { fields, addFields } = this.props;

    // get all editable/insertable fields (depending on current form type)
    let relevantFields = this.getMutableFields(schema);

    // if "fields" prop is specified, restrict list of fields to it
    if (typeof fields !== 'undefined' && fields.length > 0) {
      relevantFields = _.intersection(relevantFields, fields);
    }

    // if "removeFields" prop is specified, remove its fields
    if (excludeRemovedFields) {
      const removeFields = this.props.removeFields;
      if (typeof removeFields !== 'undefined' && removeFields.length > 0) {
        relevantFields = _.difference(relevantFields, removeFields);
      }
    }

    // if "addFields" prop is specified, add its fields
    if (
      addExtraFields &&
      typeof addFields !== 'undefined' &&
      addFields.length > 0
    ) {
      relevantFields = relevantFields.concat(addFields);
    }

    // remove all hidden fields
    if (excludeHiddenFields) {
      const document = this.getDocument();
      relevantFields = _.reject(relevantFields, fieldName => {
        const hidden = schema[fieldName].hidden;
        return typeof hidden === 'function'
          ? hidden({ ...this.props, document })
          : hidden;
      });
    }

    // remove any duplicates
    relevantFields = uniq(relevantFields);

    return relevantFields;
  };

  // TODO: fieldSchema is actually a slightly added-to version of
  // CollectionFieldSpecification, see convertSchema in schema_utils, but in
  // this function, it acts like CollectionFieldSpecification
  initField = (fieldName: string, fieldSchema: CollectionFieldSpecification<N>) => {
    // intialize properties
    let field: FormFieldUnfinished<N> = {
      ...pick(fieldSchema, formProperties),
      document: this.state.initialDocument,
      name: fieldName,
      datatype: fieldSchema.type,
      layout: this.props.layout || "horizontal",
      input: fieldSchema.control
    };
    field.label = this.getLabel(fieldName);

    // if options are a function, call it
    if (typeof field.options === 'function') {
      field.options = field.options.call(fieldSchema, this.props);
    }

    // add any properties specified in fieldSchema.form as extra props passed on
    // to the form component, calling them if they are functions
    const inputProperties = fieldSchema.form || {};
    for (const prop in inputProperties) {
      const property = inputProperties[prop];
      (field as AnyBecauseTodo)[prop] =
        isFunction(property)
          ? property.call(fieldSchema, this.props)
          : property;
    }

    // add description as help prop
    if (fieldSchema.description) {
      field.help = fieldSchema.description;
    }
    return field;
  };
  handleFieldPath = (field: FormFieldUnfinished<N>, fieldName: string, parentPath?: string): FormFieldUnfinished<N> => {
    const fieldPath = parentPath ? `${parentPath}.${fieldName}` : fieldName;
    field.path = fieldPath;
    if (field.defaultValue) {
      set(this.defaultValues, fieldPath, field.defaultValue);
    }
    return field;
  };
  handleFieldParent = (field: FormFieldUnfinished<N>, parentFieldName?: string) => {
    // if field has a parent field, pass it on
    if (parentFieldName) {
      field.parentFieldName = parentFieldName;
    }

    return field;
  };
  handlePermissions = (field: FormFieldUnfinished<N>, fieldName: string, mutableFields: any) => {
    // if field is not creatable/updatable, disable it
    if (!mutableFields.includes(fieldName)) {
      field.disabled = true;
    }
    return field;
  };
  handleFieldChildren = (field: FormFieldUnfinished<N>, fieldName: string, fieldSchema: any, mutableFields: any, schema: any) => {
    // array field
    if (fieldSchema.field) {
      field.arrayFieldSchema = fieldSchema.field;
      // create a field that can be exploited by the form
      field.arrayField = this.createArraySubField(
        fieldName,
        field.arrayFieldSchema,
        mutableFields
      );

      //field.nestedInput = true
    }
    // nested fields: set input to "nested"
    if (fieldSchema.schema) {
      field.nestedSchema = fieldSchema.schema;
      field.nestedInput = true;

      // get nested schema
      // for each nested field, get field object by calling createField recursively
      field.nestedFields = this.getFieldNames({
        schema: field.nestedSchema, addExtraFields: false
      }).map(subFieldName => {
        return this.createField(
          subFieldName,
          field.nestedSchema,
          mutableFields,
          fieldName,
          field.path
        );
      });
    }
    return field;
  };

  /**
   * Given a field's name, the containing schema, and parent, create the
   * complete form-field object to be passed to the component
   */
  createField = (fieldName: string, schema: any, mutableFields: any, parentFieldName?: string, parentPath?: string) => {
    const fieldSchema = schema[fieldName];
    let field: FormFieldUnfinished<N> = this.initField(fieldName, fieldSchema);
    field = this.handleFieldPath(field, fieldName, parentPath);
    field = this.handleFieldParent(field, parentFieldName);
    field = this.handlePermissions(field, fieldName, mutableFields);
    field = this.handleFieldChildren(field, fieldName, fieldSchema, mutableFields, schema);
    // Now that it's done being constructed, all the required fields will be set
    return field as FormField<N>;
  };
  createArraySubField = (fieldName: AnyBecauseTodo, subFieldSchema: AnyBecauseTodo, mutableFields: AnyBecauseTodo) => {
    const subFieldName = `${fieldName}.$`;
    let subField = this.initField(subFieldName, subFieldSchema);
    // array subfield has the same path and permissions as its parent
    // so we use parent name (fieldName) and not subfieldName
    subField = this.handleFieldPath(subField, fieldName);
    subField = this.handlePermissions(subField, fieldName, mutableFields);
    // we do not allow nesting yet
    //subField = this.handleFieldChildren(field, fieldSchema, mutableFields, schema)
    return subField;
  };

  /*

   Get a field's label

   */
  getLabel = (fieldName: string, fieldLocale?: any): string => {
    const collectionName = this.props.collectionName.toLowerCase();
    const label = formatLabel({
      fieldName: fieldName,
      collectionName: collectionName,
      schema: this.state.flatSchema,
    });
    if (fieldLocale) {
      const intlFieldLocale = formatMessage({
        id: `locales.${fieldLocale}`,
        defaultMessage: fieldLocale,
      });
      return `${label} (${intlFieldLocale})`;
    } else {
      return label;
    }
  };

  // --------------------------------------------------------------------- //
  // ------------------------------- Errors ------------------------------ //
  // --------------------------------------------------------------------- //

  /*

  Add error to form state

  Errors can have the following properties:
    - id: used as an internationalization key, for example `errors.required`
    - path: for field-specific errors, the path of the field with the issue
    - properties: additional data. Will be passed to vulcan-i18n as values
    - message: if id cannot be used as i81n key, message will be used

  */
  throwError = (error: AnyBecauseTodo) => {
    let formErrors = getErrors(error);

    // eslint-disable-next-line no-console
    console.log(formErrors);

    // add error(s) to state
    this.setState(prevState => ({
      errors: [...prevState.errors, ...formErrors]
    }));
  };

  /*

  Clear errors for a field

  */
  clearFieldErrors = (path: string) => {
    const errors = this.state.errors.filter(error => error.path !== path);
    this.setState({ errors });
  };

  // --------------------------------------------------------------------- //
  // ------------------------------- Context ----------------------------- //
  // --------------------------------------------------------------------- //

  // add something to deleted values
  addToDeletedValues = (name: string) => {
    this.setState(prevState => ({
      deletedValues: [...prevState.deletedValues, name]
    }));
  };

  // Add a callback to the form submission. Return a cleanup function which,
  // when run, removes that callback.
  addToSubmitForm = (callback: AnyBecauseTodo) => {
    this.submitFormCallbacks.push(callback);
    return () => {
      const index = this.submitFormCallbacks.indexOf(callback);
      if (index >= 0)
        this.submitFormCallbacks.splice(index, 1);
    };
  };

  // Add a callback to form submission success. Return a cleanup function which,
  // when run, removes that callback.
  addToSuccessForm = (callback: AnyBecauseTodo) => {
    this.successFormCallbacks.push(callback);
    return () => {
      const index = this.successFormCallbacks.indexOf(callback);
      if (index >= 0)
        this.successFormCallbacks.splice(index, 1);
    };
  };

  // Add a callback to form submission failure. Return a cleanup function which,
  // when run, removes that callback.
  addToFailureForm = (callback: AnyBecauseTodo) => {
    this.failureFormCallbacks.push(callback);
    return () => {
      const index = this.failureFormCallbacks.indexOf(callback);
      if (index >= 0)
        this.failureFormCallbacks.splice(index, 1);
    };
  };

  setFormState = (fn: AnyBecauseTodo) => {
    this.setState(fn);
  };

  // pass on context to all child components
  getChildContext = () => {
    return {
      throwError: this.throwError,
      clearForm: this.clearForm,
      refetchForm: this.refetchForm,
      isChanged: this.isChanged,
      submitForm: this.submitForm, //Change in name because we already have a function
      // called submitForm, but no reason for the user to know
      // about that
      addToDeletedValues: this.addToDeletedValues,
      updateCurrentValues: this.updateCurrentValues,
      getDocument: this.getDocument,
      getLabel: this.getLabel,
      initialDocument: this.state.initialDocument,
      setFormState: this.setFormState,
      addToSubmitForm: this.addToSubmitForm,
      addToSuccessForm: this.addToSuccessForm,
      addToFailureForm: this.addToFailureForm,
      errors: this.state.errors,
      currentValues: this.state.currentValues,
      deletedValues: this.state.deletedValues
    };
  };

  // --------------------------------------------------------------------- //
  // ------------------------------ Lifecycle ---------------------------- //
  // --------------------------------------------------------------------- //

  /*

  When props change, reinitialize the form  state
  Triggered only for data related props (collection, document, currentUser etc.)

  @see https://reactjs.org/blog/2018/06/07/you-probably-dont-need-derived-state.html

  */
  UNSAFE_componentWillReceiveProps(nextProps: SmartFormProps<N>) {
    for (const prop of RESET_PROPS) {
      const prev = this.props[prop];
      const next = nextProps[prop];
      if (!isEqual(prev, next)) {
        if (
          prop === "currentUser" &&
          prev._id === next._id &&
          prev.acceptedTos !== next.acceptedTos
        ) {
          continue;
        }
        if (prop === "prefilledProps") {
          const updates: Record<string, AnyBecauseTodo> = {};
          const keys = new Set([...Object.keys(next), ...Object.keys(prev)]);
          for (const key of keys) {
            if (next[key] !== prev[key]) {
              updates[key] = next[key];
            }
          }
          void this.updateCurrentValues(updates);
        } else {
          this.setState(getInitialStateFromProps(nextProps));
        }
        break;
      }
    }
  }

  // Manually update the current values of one or more fields(i.e. on change or blur).
  // Return a promise that resolves when the change is fully applied. Since this is
  // a React state update, this is not immediate.
  updateCurrentValues = async (newValues: AnyBecauseTodo, options: any = {}) => {
    // default to overwriting old value with new
    const { mode = 'overwrite' } = options;
    const { autoSubmit, changeCallback } = this.props;

    // keep the previous ones and extend (with possible replacement) with new ones
    return new Promise<void>((resolve, reject) => {
      this.setState(prevState => {
        // keep only the relevant properties
        const newState = {
          currentValues: cloneDeep(prevState.currentValues),
          currentDocument: cloneDeep(prevState.currentDocument),
          deletedValues: prevState.deletedValues,
        };
  
        Object.keys(newValues).forEach(key => {
          const path = key;
          let value = newValues[key];
  
          if (isEmptyValue(value)) {
            // delete value
            unset(newState.currentValues, path);
            set(newState.currentDocument, path, null);
            newState.deletedValues = [...prevState.deletedValues, path];
          } else {
  
            // 1. update currentValues
            set(newState.currentValues, path, value);
  
            // 2. update currentDocument
            // For arrays and objects, give option to merge instead of overwrite
            if (mode === 'merge' && (Array.isArray(value) || isObject(value))) {
              const oldValue = get(newState.currentDocument, path);
              set(newState.currentDocument, path, merge(oldValue, value));
            } else {
              set(newState.currentDocument, path, value);
            }
  
            // 3. in case value had previously been deleted, "undelete" it
            newState.deletedValues = _.without(prevState.deletedValues, path);
          }
        });
        if (changeCallback) changeCallback(newState.currentDocument);
        return newState;
      }, () => {
        if (autoSubmit) void this.submitForm();
        return resolve()
      })
    });
  };

  /*

  Install a route leave hook to warn the user if there are unsaved changes

  */
  componentDidMount = () => {
    this.checkRouteChange();
    this.checkBrowserClosing();
    
    if (this.formRef.current) {
      // Attack a keyboard event handler with `{capture:true}` (rather than using
      // a normal event handler with `onKeyDown)`. We do this so that if the
      // key event turns out to be Cmd+Enter, we can call `stopPropagation` on
      // it so that it submits without also inserting a newline.
      this.formRef.current.addEventListener('keydown',
        (ev: KeyboardEvent) => {
          this.formKeyDown(ev)
        }, { capture: true });
    }
  }

  /*
  Remove the closing browser check on component unmount
  see https://gist.github.com/mknabe/bfcb6db12ef52323954a28655801792d
  */
  componentWillUnmount = () => {
    if (this.getWarnUnsavedChanges()) {
      // unblock route change
      if (this.unblock) {
        this.unblock();
      }
      // unblock browser change
      (window as any).onbeforeunload = undefined; //undefined instead of null to support IE
    }
  };


  // -------------------- Check on form leaving ----- //

  /**
   * Check if we must warn user on unsaved change
   */
  getWarnUnsavedChanges = () => {
    return this.props.warnUnsavedChanges
  }

  // check for route change, prevent form content loss
  checkRouteChange = () => {
    // TODO FIXME: This was a casualty of upgrading react router v5->v6
    
    // @see https://github.com/ReactTraining/react-router/issues/4635#issuecomment-297828995
    // @see https://github.com/ReactTraining/history#blocking-transitions
    if (this.getWarnUnsavedChanges()) {
      this.unblock = this.props.history?.block((location: AnyBecauseTodo, action: AnyBecauseTodo) => {
        // return the message that will pop into a window.confirm alert
        // if returns nothing, the message won't appear and the user won't be blocked
        return this.handleRouteLeave();
      });
    }
  }
  // check for browser closing
  checkBrowserClosing = () => {
    if (this.getWarnUnsavedChanges()) {
      //check for closing the browser with unsaved changes too
      (window as any).onbeforeunload = this.handlePageLeave;
    }
  }

  /*
  Check if the user has unsaved changes, returns a message if yes
  and nothing if not
  */
  handleRouteLeave = () => {
    if (this.isChanged()) {
      return "Discard changes?";
    }
  };

  /**
   * Same for browser closing
   *
   * see https://developer.mozilla.org/en-US/docs/Web/API/WindowEventHandlers/onbeforeunload
   * the message returned is actually ignored by most browsers and a default message 'Are you sure you want to leave this page? You might have unsaved changes' is displayed. See the Notes section on the mozilla docs above
   */
  handlePageLeave = (event: AnyBecauseTodo) => {
    if (this.isChanged()) {
      const message = "Discard changes?"
      if (event) {
        event.returnValue = message;
      }

      return message;
    }
  };
  /*

  Returns true if there are any differences between the initial document and the current one

  */
  isChanged = () => {
    const initialDocument = this.state.initialDocument;
    const changedDocument = this.getDocument();

    const changedValue = find(changedDocument, (value, key, collection) => {
      return !isEqualWith(value, initialDocument[key], (objValue, othValue) => {
        if (!objValue && !othValue) return true;
      });
    });

    return typeof changedValue !== 'undefined';
  };

  /*

  Refetch the document from the database (in case it was updated by another process or to reset the form)

  */
  refetchForm = () => {
    if (this.props.data && this.props.data.refetch) {
      this.props.data.refetch();
    }
  };

  /**
   * Clears form errors and values.
   *
   * @example Clear form
   *  // form will be fully emptied, with exception of prefilled values
   *  clearForm({ document: {} });
   *
   * @example Reset/revert form
   *  // form will be reverted to its initial state
   *  clearForm();
   *
   * @example Clear with new values
   *  // form will be cleared but initialized with the new document
   *  const document = {
   *    // ... some values
   *  };
   *  clearForm({ document });
   *
   * @param {Object=} options
   * @param {Object=} options.document
   *  Document to use as new initial document when values are cleared instead of
   *  the existing one. Note that prefilled props will be merged
   */
  clearForm = ({ document=null }) => {
    document = document ? merge({}, this.props.prefilledProps||{}, document) : null;
    this.setState(prevState => ({
      errors: [],
      currentValues: {},
      deletedValues: [],
      currentDocument: document || prevState.initialDocument,
      initialDocument: document || prevState.initialDocument,
      disabled: false
    }));
  };

  /** Key down handler */
  formKeyDown = (event: KeyboardEvent) => {
    //Ctrl+Enter or Cmd+Enter submits the form
    if ((event.ctrlKey || event.metaKey) && event.keyCode === 13) {
      if (!this.props.noSubmitOnCmdEnter) {
        event.stopPropagation();
        event.preventDefault();
        void this.submitForm();
      }
    }
  };

  newMutationSuccessCallback = (result: AnyBecauseTodo, submitOptions?: AnyBecauseTodo) => {
    this.mutationSuccessCallback(result, 'new', submitOptions);
  };

  editMutationSuccessCallback = (result: AnyBecauseTodo, submitOptions?: AnyBecauseTodo) => {
    this.mutationSuccessCallback(result, 'edit', submitOptions);
  };

  mutationSuccessCallback = (result: AnyBecauseTodo, mutationType: AnyBecauseTodo, submitOptions?: AnyBecauseTodo) => {
    this.setState(prevState => ({ disabled: false }));
    let document = result.data[Object.keys(result.data)[0]].data; // document is always on first property

    // for new mutation, run refetch function if it exists
    if (mutationType === 'new' && this.props.refetch) this.props.refetch();

    // call the clear form method (i.e. trigger setState) only if the form has not been unmounted
    // (we are in an async callback, everything can happen!)
    // avoid doing this if we're autosaving a new post without reloading
    if (this.formRef.current) {
      this.clearForm({
        document: mutationType === 'edit' || submitOptions?.noReload ? document : undefined
      });
    }

    // run document through mutation success callbacks
    document = runCallbacksList({
      callbacks: this.successFormCallbacks,
      iterator: document,
      properties: [this, submitOptions],
    });

    // run success callback if it exists
    if (this.props.successCallback) {
      this.props.successCallback(document, {
        form: this,
        submitOptions
      });
    }
  };

  // catch graphql errors
  mutationErrorCallback = (document: AnyBecauseTodo, error: AnyBecauseTodo) => {
    this.setState(prevState => ({ disabled: false }));

    // eslint-disable-next-line no-console
    console.log('// graphQL Error');
    // Error is sometimes actually a ApolloError which wraps a real 
    // error, and displaying this is surprisingly hard. See this:
    // https://stackoverflow.com/questions/18391212/is-it-not-possible-to-stringify-an-error-using-json-stringify
    // eslint-disable-next-line no-console
    console.log(JSON.stringify(error, (key: AnyBecauseTodo, value) =>
      (value instanceof Error) ?
        Object.getOwnPropertyNames(value).reduce((ac: AnyBecauseTodo, propName: AnyBecauseTodo) => {
          ac[propName] = (value as AnyBecauseTodo)[propName];
          return ac;
        }, {})
        : value
    ))
  
    // run mutation failure callbacks on error, we do not allow the callbacks to change the error
    runCallbacksList({
      callbacks: this.failureFormCallbacks,
      iterator: error,
      properties: [error, this],
    });

    if (!_.isEmpty(error)) {
      // add error to state
      this.throwError(error);
    }

    // run error callback if it exists
    if (this.props.errorCallback) this.props.errorCallback(document, error, { form: this });

    // scroll back up to show error messages
    // LESSWRONG: Removed because what this actually does is align the error
    // message with the top of the screen, which is usually scrolling *down*,
    // and which is a terrible jarring experience.
    //Utils.scrollIntoView('.flash-message');
  };

  /*

  Submit form handler

  */
  submitForm = async (event?: any, submitOptions?: any) => {
    if (event) {
      event.preventDefault();
    }

    // if form is disabled (there is already a submit handler running) don't do anything
    if (this.state.disabled) {
      return;
    }

    // clear errors and disable form while it's submitting
    this.setState(prevState => ({ errors: [], disabled: true }));

    // complete the data with values from custom components
    // note: it follows the same logic as SmartForm's getDocument method
    let data = await this.getData({ addExtraFields: false });

    // if there's a submit callback, run it
    if (this.props.submitCallback) {
      data = this.props.submitCallback(data) || data;
    }

    if (this.getFormType() === 'new') {
      // create document form
      try {
        const result = await this.props.createMutation({ data });
        this.newMutationSuccessCallback(result, submitOptions);
      } catch(error) {
        this.mutationErrorCallback(document, error);
      }
    } else {
      // update document form
      const documentId = this.getDocument()._id;
      try {
        const result = await this.props.updateMutation({
          selector: { documentId },
          data
        });
        this.editMutationSuccessCallback(result, submitOptions);
      } catch(error) {
        this.mutationErrorCallback(document, error);
      }
    }
  };

  /*

  Delete document handler

  */
  deleteDocument = () => {
    const document = this.getDocument();
    const documentId = this.props.document?._id;
    const documentTitle = document.title || document.name || '';

    const deleteDocumentConfirm = "Delete document?";

    if (window.confirm(deleteDocumentConfirm)) {
      this.props
        .removeMutation({ documentId })
        .then((mutationResult: AnyBecauseTodo) => {
          // the mutation result looks like {data:{collectionRemove: null}} if succeeded
          if (this.props.removeSuccessCallback)
            this.props.removeSuccessCallback({ documentId, documentTitle });
          if (this.props.refetch) this.props.refetch();
        })
        .catch((error: AnyBecauseTodo) => {
          // eslint-disable-next-line no-console
          console.log(error);
        });
    }
  };


  // --------------------------------------------------------------------- //
  // ----------------------------- Render -------------------------------- //
  // --------------------------------------------------------------------- //

  render() {
    const FormSubmit = this.props.formComponents?.FormSubmit ?? Components.FormSubmit;
    return (
      <form
        className={classNames(
          'vulcan-form',
          `document-${this.getFormType()}`,
          this.props?.formProps?.formClassName,
        )}
        id={this.props.id}
        onSubmit={this.submitForm}
        ref={this.formRef}
      >
        <Components.FormErrors
          errors={this.state.errors}
        />

        {this.getFieldGroups().map((group, i) => (
          <Components.FormGroup
            group={group}
            fields={group.fields as FormField<any>[]}
            errors={this.state.errors}
            throwError={this.throwError}
            currentValues={this.state.currentValues}
            updateCurrentValues={this.updateCurrentValues}
            deletedValues={this.state.deletedValues}
            addToDeletedValues={this.addToDeletedValues}
            clearFieldErrors={this.clearFieldErrors}
            formType={this.getFormType()}
            disabled={this.state.disabled}
            formComponents={this.props.formComponents}
            formProps={this.props.formProps}
            key={`${i}-${group.name}`}
          />
        ))}

        {this.props.repeatErrors && <Components.FormErrors
          errors={this.state.errors}
        />}

        {!this.props.autoSubmit && <FormSubmit
          submitLabel={this.props.submitLabel}
          cancelLabel={this.props.cancelLabel}
          revertLabel={this.props.revertLabel}
          cancelCallback={this.props.cancelCallback}
          revertCallback={this.props.revertCallback}
          submitForm={this.submitForm}
          updateCurrentValues={this.updateCurrentValues}
          formType={this.getFormType()}
          document={this.getDocument()}
          deleteDocument={
            (this.getFormType() === 'edit' &&
              this.props.showRemove &&
              this.deleteDocument) ||
            null
          }
          collectionName={this.props.collectionName}
          currentValues={this.state.currentValues}
          deletedValues={this.state.deletedValues}
          errors={this.state.errors}
        />}
      </form>
    );
  }
}

(Form as any).propTypes = {
  // main options
  collectionName: PropTypes.string.isRequired,
  typeName: PropTypes.string.isRequired,
  document: PropTypes.object, // if a document is passed, this will be an edit form
  schema: PropTypes.object, // usually not needed

  // graphQL
  newMutation: PropTypes.func, // the new mutation
  removeMutation: PropTypes.func, // the remove mutation

  // form
  prefilledProps: PropTypes.object,
  layout: PropTypes.string,
  fields: PropTypes.arrayOf(PropTypes.string),
  addFields: PropTypes.arrayOf(PropTypes.string),
  removeFields: PropTypes.arrayOf(PropTypes.string),
  showRemove: PropTypes.bool,
  submitLabel: PropTypes.node,
  cancelLabel: PropTypes.node,
  revertLabel: PropTypes.node,
  repeatErrors: PropTypes.bool,
  noSubmitOnCmdEnter: PropTypes.bool,
  warnUnsavedChanges: PropTypes.bool,
  formComponents: PropTypes.object,

  // callbacks
  ...callbackProps,

  currentUser: PropTypes.object,
};

(Form as any).childContextTypes = {
  addToDeletedValues: PropTypes.func,
  deletedValues: PropTypes.array,
  addToSubmitForm: PropTypes.func,
  addToFailureForm: PropTypes.func,
  addToSuccessForm: PropTypes.func,
  updateCurrentValues: PropTypes.func,
  setFormState: PropTypes.func,
  throwError: PropTypes.func,
  clearForm: PropTypes.func,
  refetchForm: PropTypes.func,
  isChanged: PropTypes.func,
  initialDocument: PropTypes.object,
  getDocument: PropTypes.func,
  getLabel: PropTypes.func,
  submitForm: PropTypes.func,
  errors: PropTypes.array,
  currentValues: PropTypes.object
};
