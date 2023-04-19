import React from 'react';
import PropTypes from 'prop-types';
import { intlShape } from '../../lib/vulcan-i18n';
// HACK: withRouter should be removed or turned into withLocation, but
// FormWrapper passes props around in bulk, and Form has a bunch of prop-name
// handling by string gluing, so it's hard to be sure this is safe.
// eslint-disable-next-line no-restricted-imports
import { withRouter } from 'react-router';
import { gql } from '@apollo/client';
import { Components, registerComponent, getFragment } from '../../lib/vulcan-lib';
import { capitalize } from '../../lib/vulcan-lib/utils';
import { useCreate } from '../../lib/crud/withCreate';
import { useSingle, DocumentIdOrSlug } from '../../lib/crud/withSingle';
import { useDelete } from '../../lib/crud/withDelete';
import { useUpdate } from '../../lib/crud/withUpdate';
import { getSchema } from '../../lib/utils/getSchema';
import { getCollection } from '../../lib/vulcan-lib/getCollection';
import { useCurrentUser } from '../common/withUser';
import { getReadableFields, getCreateableFields, getUpdateableFields } from '../../lib/vulcan-forms/schema_utils';
import { callbackProps, WrappedSmartFormProps } from './propTypes';
import { Form } from './Form';
import * as _ from 'underscore';

const intlSuffix = '_intl';

/**
 * Get fragment used to decide what data to load from the server to populate the form,
 * as well as what data to ask for as return value for the mutation
 */
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

  const convertFields = (field: AnyBecauseTodo) => {
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
 *
 * This looks at whether it was given a documentId/slug to determine whether
 * it's an edit form, in which case it loads the specified document and adds
 * update/delete mutators, or a new form, in which case it adds a create
 * mutator. In both cases, unpacks fragment/fragmentName with `getFragments`,
 * generating a default fragment if none is given.
 */
const FormWrapper = ({showRemove=true, ...props}: WrappedSmartFormProps) => {
  const collection = getCollection(props.collectionName);
  const schema = getSchema(collection);

  // if a document is being passed, this is an edit form
  const formType = (props.documentId || props.slug) ? 'edit' : 'new';
  
  if (formType === "edit") {
    return <FormWrapperEdit {...props} showRemove={showRemove} schema={schema}/>
  } else {
    return <FormWrapperNew {...props} showRemove={showRemove} schema={schema}/>
  }
}

/**
 * Wrapper around a 'new' form, which adds createMutation. Should be used only
 * via FormWrapper.
 */
const FormWrapperNew = (props: WrappedSmartFormProps&{schema: any}) => {
  const currentUser = useCurrentUser();
  const collection = getCollection(props.collectionName);
  const { mutationFragment } = getFragments("new", props);

  const {create} = useCreate({
    collectionName: collection.collectionName,
    fragment: mutationFragment,
  });
  return <Form
    {...props}
    currentUser={currentUser}
    collection={collection}
    typeName={collection.typeName}
    schema={props.schema}
    createMutation={create}
  />
}

/**
 * Wrapper around an 'edit' form, which adds updateMutation. Should be used only
 * via FormWrapper.
 */
const FormWrapperEdit = (props: WrappedSmartFormProps&{schema: any}) => {
  const currentUser = useCurrentUser();
  const collection = getCollection(props.collectionName);
  const { queryFragment, mutationFragment } = getFragments("edit", props);
  const { extraVariables = {}, extraVariablesValues } = props
  
  const selector: DocumentIdOrSlug = props.documentId
    ? {documentId: props.documentId}
    : {slug: props.slug}
  const { document, loading } = useSingle({
    ...selector,
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
  return <Form
    {...props}
    currentUser={currentUser}
    collection={collection}
    typeName={collection.typeName}
    schema={props.schema}
    document={document}
    updateMutation={updateMutation}
    removeMutation={deleteDocument}
  />
}

const FormWrapperComponent = registerComponent('FormWrapper', FormWrapper, {
  hocs: [withRouter],
  areEqual: "auto"
});

declare global {
  interface ComponentTypes {
    FormWrapper: typeof FormWrapperComponent
  }
}
