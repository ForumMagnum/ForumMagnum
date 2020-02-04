import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { Components, registerComponent } from '../../lib/vulcan-core';

export class AccountsForm extends PureComponent<any> {
  form: any
  
  componentDidMount() {
    let form = this.form;
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
      });
    }
  }

  render() {
    const {
      // hasPasswordService,
      oauthServices,
      fields,
      buttons,
      // error,
      messages,
      ready = true,
      className,
    } = this.props;
    const _className = classnames('accounts-ui', { ready }, className);
    return (
      <form
        ref={(ref) => this.form = ref}
        className={_className}
        noValidate
      >
        <Components.AccountsFields fields={ fields } />
        <Components.AccountsButtons buttons={ buttons } />
        <Components.AccountsPasswordOrService oauthServices={ oauthServices } />
        <Components.AccountsSocialButtons oauthServices={ oauthServices } />
        <Components.AccountsFormMessages messages={messages} />
        <div className="reCaptcha-text">
            This site is protected by reCAPTCHA and the Google <a href="https://policies.google.com/privacy">Privacy Policy</a> and <a href="https://policies.google.com/terms">Terms of Service</a> apply.
        </div>
      </form>
    );
  }
}
(AccountsForm as any).propTypes = {
  oauthServices: PropTypes.object,
  fields: PropTypes.object.isRequired,
  buttons: PropTypes.object.isRequired,
  error: PropTypes.string,
  ready: PropTypes.bool
};

const AccountsFormComponent = registerComponent('AccountsForm', AccountsForm);

declare global {
  interface ComponentTypes {
    AccountsForm: typeof AccountsFormComponent
  }
}

