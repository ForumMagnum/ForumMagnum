/*
 * This component wraps SmartForm (see below for why), which is defined in
 * FormWrapper.tsx (where it calls itself FormWrapper), which itself wraps Form,
 * which is defined in Form.tsx (where it calls itself SmartForm).
 */
import React from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import { editableCollections, editableCollectionsFields } from '../../lib/editor/make_editable'
import * as _ from 'underscore';

/**
 * This is a wrapper around FormWrapper which adds a submit callback that filters
 * out any data that would cause problems with editable fields. This is
 * necessary because editable fields have a different input type than they have
 * query type, and so we have to make sure to not resubmit any data that we
 * queried
 */
function WrappedSmartForm(props) {
  const { collection } = props
  const collectionName = collection && collection.options && collection.options.collectionName
  if (editableCollections.has(collectionName)) {
    return <Components.FormWrapper
      {...props}
      submitCallback={(data) => {
        if (props.submitCallback) {data = props.submitCallback(data)}
        
        // For all editable fields, ensure that we actually have data, and make sure we submit the response in the correct shape
        const editableFields = _.object(editableCollectionsFields[collectionName].map(fieldName => {
          const { originalContents, updateType, commitMessage } = (data && data[fieldName]) || {}
          return [
            fieldName, // _.object takes array of tuples, with first value being fieldName and second being value
            (originalContents?.data) ? // Ensure that we have data
              { originalContents, updateType, commitMessage } : // If so, constrain it to correct shape
              undefined // If not, set field to undefined
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
    WrappedSmartForm: typeof WrappedSmartFormComponent
  }
}
