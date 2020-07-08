import { Components, registerComponent } from '../../lib/vulcan-lib';
import React from 'react';

const EditButton = ({ style = 'primary', label, size, showId, modalProps, formProps, ...props }) => (
  <Components.ModalTrigger
    label={label || "Edit"}
    component={
      <Components.Button size={size} variant={style}>
        {label || "Edit"}
      </Components.Button>
    }
    modalProps={modalProps}
  >
    <Components.EditForm {...props} formProps={formProps}/>
  </Components.ModalTrigger>
);

EditButton.displayName = 'EditButton';

const EditButtonComponent = registerComponent('EditButton', EditButton);

/*

EditForm Component

*/
const EditForm = ({ closeModal, successCallback, removeSuccessCallback, formProps, ...props }) => {

  const success = successCallback
    ? document => {
        successCallback(document);
        closeModal();
      }
    : closeModal;

  const remove = removeSuccessCallback
    ? document => {
        removeSuccessCallback(document);
        closeModal();
      }
    : closeModal;

  return (
    <Components.SmartForm successCallback={success} removeSuccessCallback={remove} {...formProps} {...props} />
  );
};
const EditFormComponent = registerComponent('EditForm', EditForm);

declare global {
  interface ComponentTypes {
    EditButton: typeof EditButtonComponent
    EditForm: typeof EditFormComponent
  }
}
