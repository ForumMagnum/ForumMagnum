import React, { Component } from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import PropTypes from 'prop-types';

export const EditorFormComponent = ({form, formType, formProps, document, name, fieldName, value, hintText, placeholder, label, commentStyles}: {
  form: any,
  formType: any,
  formProps: any,
  document: any,
  name: any,
  fieldName: any,
  value: any,
  hintText: string,
  placeholder: string,
  label: string,
  commentStyles: boolean,
}, context: any) => {
  const { commentEditor, collectionName, hideControls } = (form || {});
  const { editorHintText, maxHeight } = (formProps || {});
  
  return <Components.Editor
    formType={formType}
    document={document}
    name={name}
    fieldName={fieldName}
    value={value}
    hintText={hintText}
    placeholder={placeholder}
    label={label}
    commentStyles={commentStyles}
    addToSubmitForm={context.addToSubmitForm}
    addToSuccessForm={context.addToSuccessForm}
    commentEditor={commentEditor}
    collectionName={collectionName}
    hideControls={hideControls}
    editorHintText={editorHintText}
    maxHeight={maxHeight}
  />
}

export const EditorFormComponentComponent = registerComponent('EditorFormComponent', EditorFormComponent);

(EditorFormComponent as any).contextTypes = {
  addToSubmitForm: PropTypes.func,
  addToSuccessForm: PropTypes.func
};

declare global {
  interface ComponentTypes {
    EditorFormComponent: typeof EditorFormComponentComponent
  }
}
