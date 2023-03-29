/*

Generate the appropriate fragment for the current form, then
wrap the main Form component with the necessary HoCs while passing
them the fragment.

This component is itself wrapped with:

- withUser
- withApollo (used to access the Apollo client for form pre-population)

And wraps the Form component with:

- withCreate

Or:

- withSingle
- withUpdate
- withDelete

(When wrapping with withSingle, withUpdate, and withDelete, a special Loader
component is also added to wait for withSingle's loading prop to be false)

*/

import React from 'react';
import PropTypes from 'prop-types';
import { intlShape } from '../../lib/vulcan-i18n';
// HACK: withRouter should be removed or turned into withLocation, but
// FormWrapper passes props around in bulk, and Form has a bunch of prop-name
// handling by string gluing, so it's hard to be sure this is safe.
// eslint-disable-next-line no-restricted-imports
import { withRouter } from 'react-router';
import { gql } from '@apollo/client';
import { withApollo } from '@apollo/client/react/hoc';
import { Components, registerComponent, getFragment } from '../../lib/vulcan-lib';
import { capitalize } from '../../lib/vulcan-lib/utils';
import { useCreate } from '../../lib/crud/withCreate';
import { useSingle } from '../../lib/crud/withSingle';
import { useDelete } from '../../lib/crud/withDelete';
import { useUpdate } from '../../lib/crud/withUpdate';
import { getSchema } from '../../lib/utils/getSchema';
import { getCollection } from '../../lib/vulcan-lib/getCollection';
import withUser from '../common/withUser';
import { getReadableFields, getCreateableFields, getUpdateableFields } from '../../lib/vulcan-forms/schema_utils';

import withCollectionProps from './withCollectionProps';
import { callbackProps, WrappedSmartFormProps } from './propTypes';
import * as _ from 'underscore';

const intlSuffix = '_intl';

// get fragment used to decide what data to load from the server to populate the form,
// as well as what data to ask for as return value for the mutation
const getFragments = (formType: "edit"|"new", props: WrappedSmartFormProps) => {
  const collection = getCollection(props.collectionName);
  const schema = getSchema(collection);
  const fragmentName = `${props.collectionName}${capitalize(formType)}FormFragment`;
  const queryFragmentName = `${fragmentName}Query`;
  const mutationFragmentName = `${fragmentName}Mutation`;

  const fields = props.fields;
  const readableFields = getReadableFields(schema);
  const createableFields = getCreateableFields(schema);
  const updatetableFields = getUpdateableFields(schema);

  // get all editable/insertable fields (depending on current form type)
  let queryFields = formType === 'new' ? createableFields : updatetableFields;
  // for the mutations's return value, also get non-editable but viewable fields (such as createdAt, userId, etc.)
  let mutationFields =
    formType === 'new'
      ? _.unique(createableFields.concat(readableFields))
      : _.unique(createableFields.concat(updatetableFields));

  // if "fields" prop is specified, restrict list of fields to it
  if (typeof fields !== 'undefined' && fields.length > 0) {
    // add "_intl" suffix to all fields in case some of them are intl fields
    const fieldsWithIntlSuffix = fields.map(field => `${field}${intlSuffix}`);
    const allFields = [...fields, ...fieldsWithIntlSuffix];
    queryFields = _.intersection(queryFields, allFields);
    mutationFields = _.intersection(mutationFields, allFields);
  }

  // add "addFields" prop contents to list of fields
  if (props.addFields && props.addFields.length) {
    queryFields = queryFields.concat(props.addFields);
    mutationFields = mutationFields.concat(props.addFields);
  }

  const convertFields = field => {
    return field.slice(-5) === intlSuffix ? `${field}{ locale value }` : field;
  };

  // generate query fragment based on the fields that can be edited. Note: always add _id.
  const generatedQueryFragment = gql`
    fragment ${queryFragmentName} on ${collection.typeName} {
      _id
      ${queryFields.map(convertFields).join('\n')}
    }
  `;

  // generate mutation fragment based on the fields that can be edited and/or viewed. Note: always add _id.
  const generatedMutationFragment = gql`
    fragment ${mutationFragmentName} on ${collection.typeName} {
      _id
      ${mutationFields.map(convertFields).join('\n')}
    }
  `;

  // default to generated fragments
  let queryFragment = generatedQueryFragment;
  let mutationFragment = generatedMutationFragment;

  // if queryFragment or mutationFragment props are specified, accept either fragment object or fragment string
  if (props.queryFragment) {
    queryFragment = typeof props.queryFragment === 'string'
      ? gql`${props.queryFragment}`
      : props.queryFragment;
  }
  if (props.mutationFragment) {
    mutationFragment = typeof props.mutationFragment === 'string'
      ? gql`${props.mutationFragment}`
      : props.mutationFragment;
  }

  // same with queryFragmentName and mutationFragmentName
  if (props.queryFragmentName) {
    queryFragment = getFragment(props.queryFragmentName);
  }
  if (props.mutationFragmentName) {
    mutationFragment = getFragment(props.mutationFragmentName);
  }

  // get query & mutation fragments from props or else default to same as generatedFragment
  return { queryFragment, mutationFragment };
}

/**
 * Wrapper around Form (vulcan-forms/Form.tsx) which applies HoCs for loading
 * and saving data. Note that this wrapper is itself wrapped by WrappedSmartForm
 * (in form-components/WrappedSmartForm.tsx), which adds a submitCallback that
 * may be needed for text-editor fields; so you should use that wrapper, not
 * this one.
 */
const FormWrapper = (props: WrappedSmartFormProps) => {
  const collection = getCollection(props.collectionName);
  const schema = getSchema(collection);

  // if a document is being passed, this is an edit form
  const formType = (props.documentId || props.slug) ? 'edit' : 'new';
  
  if (formType === "edit") {
    return <FormWrapperEdit {...props} schema={schema}/>
  } else {
    return <FormWrapperNew {...props} schema={schema}/>
  }
}

const FormWrapperNew = (props: WrappedSmartFormProps&{schema: any}) => {
  const collection = getCollection(props.collectionName);
  const { mutationFragment } = getFragments("new", props);

  const {create} = useCreate({
    collectionName: collection.collectionName,
    fragment: mutationFragment,
  });
  return <Components.Form
    {...props}
    schema={props.schema}
    createMutation={create}
  />
}

const FormWrapperEdit = (props: WrappedSmartFormProps&{schema: any}) => {
  const collection = getCollection(props.collectionName);
  const { queryFragment, mutationFragment } = getFragments("edit", props);
  const { extraVariables = {}, extraVariablesValues } = props
  
  const { document, loading } = useSingle({
    documentId: props.documentId,
    collectionName: props.collectionName,
    fragment: queryFragment,
    extraVariables,
    fetchPolicy: 'network-only', // we always want to load a fresh copy of the document
  });
  const {mutate: updateMutation} = useUpdate({
    collectionName: collection.collectionName,
    fragment: mutationFragment,
  });
  const {deleteDocument} = useDelete({
    collectionName: collection.collectionName,
    fragment: mutationFragment,
  });

  if (loading) {
    return <Components.Loading/>
  }
  return <Components.Form
    {...props}
    schema={props.schema}
    document={document}
    updateMutation={updateMutation}
    removeMutation={deleteDocument}
  />
}

(FormWrapper as any).propTypes = {
  // main options
  collection: PropTypes.object.isRequired,
  collectionName: PropTypes.string.isRequired,
  typeName: PropTypes.string.isRequired,

  documentId: PropTypes.string, // if a document is passed, this will be an edit form
  schema: PropTypes.object, // usually not needed
  queryFragment: PropTypes.object,
  queryFragmentName: PropTypes.string,
  mutationFragment: PropTypes.object,
  mutationFragmentName: PropTypes.string,

  // form
  prefilledProps: PropTypes.object,
  layout: PropTypes.string,
  fields: PropTypes.arrayOf(PropTypes.string),
  hideFields: PropTypes.arrayOf(PropTypes.string),
  addFields: PropTypes.arrayOf(PropTypes.string),
  showRemove: PropTypes.bool,
  submitLabel: PropTypes.node,
  cancelLabel: PropTypes.node,
  revertLabel: PropTypes.node,
  repeatErrors: PropTypes.bool,
  warnUnsavedChanges: PropTypes.bool,

  // callbacks
  ...callbackProps,

  currentUser: PropTypes.object,
  client: PropTypes.object
};

(FormWrapper as any).defaultProps = {
  layout: 'horizontal'
};

(FormWrapper as any).contextTypes = {
  closeCallback: PropTypes.func,
  intl: intlShape
};

const FormWrapperComponent = registerComponent('FormWrapper', FormWrapper, {
  hocs: [withUser, withApollo, withRouter, withCollectionProps],
  areEqual: "auto",
});

declare global {
  interface ComponentTypes {
    FormWrapper: typeof FormWrapperComponent
  }
}
