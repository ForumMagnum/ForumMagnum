import { Components, registerComponent } from '../../lib/vulcan-lib';
import React from 'react';
import { FormattedMessage, intlShape } from '../../lib/vulcan-i18n';

const NewButton = ({ collection, size, label, style = 'primary', formProps, ...props }) => (
  <Components.ModalTrigger
    label={label || "New"}
    component={
      <Components.Button variant={style} size={size}>
       {label || <FormattedMessage id="datatable.new" />}
      </Components.Button>
    }
  >
    <Components.NewForm collection={collection} formProps={formProps} {...props} />
  </Components.ModalTrigger>
);

NewButton.displayName = 'NewButton';

const NewButtonComponent = registerComponent('NewButton', NewButton);

/*

NewForm Component

*/
const NewForm = ({ closeModal, successCallback, formProps, ...props }) => {

  const success = successCallback
    ? document => {
        successCallback(document);
        closeModal();
      }
    : closeModal;

  return <Components.SmartForm successCallback={success} {...formProps} {...props} />;
};
const NewFormComponent = registerComponent('NewForm', NewForm);

declare global {
  interface ComponentTypes {
    NewButton: typeof NewButtonComponent
    NewForm: typeof NewFormComponent
  }
}

