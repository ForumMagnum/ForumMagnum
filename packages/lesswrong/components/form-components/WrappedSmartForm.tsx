/*
 * This component wraps FormWrapper (see below for why), which is defined in
 * FormWrapper.tsx, which itself wraps Form, which is defined in Form.tsx.
 */
import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import { getEditableCollectionNames, getEditableFieldNamesForCollection } from '../../lib/editor/make_editable'
import type { WrappedSmartFormProps } from '../vulcan-forms/propTypes';
import * as _ from 'underscore';

/**
 * This is a wrapper around FormWrapper which adds a submit callback that filters
 * out any data that would cause problems with editable fields. This is
 * necessary because editable fields have a different input type than they have
 * query type, and so we have to make sure to not resubmit any data that we
 * queried
 */
function WrappedSmartForm<T extends CollectionNameString>(props: WrappedSmartFormProps<T>) {
  const { collectionName } = props

  if (getEditableCollectionNames().includes(collectionName)) {
    return <Components.FormWrapper
      {...props}
      submitCallback={(data: AnyBecauseTodo) => {
        if (props.submitCallback) {data = props.submitCallback(data)}
        
        // For all editable fields, ensure that we actually have data, and make sure we submit the response in the correct shape
        const editableFields = _.object(getEditableFieldNamesForCollection(collectionName).map(fieldName => {
          const { originalContents, updateType, commitMessage, dataWithDiscardedSuggestions } = (data && data[fieldName]) || {}
          return [
            fieldName, // _.object takes array of tuples, with first value being fieldName and second being value
            // Ensure that we have data. We check for data field presence but
            // not truthiness, because the empty string is falsy.
            (typeof originalContents==="object" && "data" in originalContents)
              // If so, constrain it to correct shape
              ? { originalContents, updateType, commitMessage, dataWithDiscardedSuggestions }
              // If not, set field to undefined
              : undefined
          ]
        }))
        return {...data, ...editableFields}
      }}
    />  
  } else {
    return <Components.FormWrapper {...props}/>
  }
}

const WrappedSmartFormComponent = registerComponent("WrappedSmartForm", WrappedSmartForm);

declare global {
  interface ComponentTypes {
    WrappedSmartForm: typeof WrappedSmartForm
  }
}
