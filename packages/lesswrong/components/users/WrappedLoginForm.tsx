import { Components, registerComponent } from '../../lib/vulcan-lib';
import withUser from '../common/withUser';
import React, { Component } from 'react';
import { reCaptchaSiteKeySetting } from '../../lib/publicSettings';
import { forumTypeSetting } from '../../lib/instanceSettings';

interface WrappedLoginFormState {
  reCaptchaToken: any
}

class WrappedLoginForm extends Component<any,WrappedLoginFormState>
{
  state: WrappedLoginFormState = {
    reCaptchaToken: null
  };
  
  setReCaptchaToken = (token) => {
    this.setState({reCaptchaToken: token})
  }
  
  render() {
    const customSignupFields = ['EAForum', 'AlignmentForum'].includes(forumTypeSetting.get())
      ? []
      : [
        {
          id: "subscribeToCurated",
          type: 'custom',
          defaultValue: true,
          renderCustom: Components.SignupSubscribeToCurated
        }
      ]
  
    return <React.Fragment>
      {reCaptchaSiteKeySetting.get()
        && <Components.ReCaptcha verifyCallback={this.setReCaptchaToken} action="login/signup"/>}
      <Components.AccountsLoginForm
        onPreSignUpHook={(options) => {
          const reCaptchaToken = this.state.reCaptchaToken
          return {...options, profile: {...options.profile, reCaptchaToken}}
        }}
        customSignupFields={customSignupFields}
        {...this.props}
      />
    </React.Fragment>;
  }
}

const WrappedLoginFormComponent = registerComponent('WrappedLoginForm', WrappedLoginForm, {
  hocs: [withUser]
});

declare global {
  interface ComponentTypes {
    WrappedLoginForm: typeof WrappedLoginFormComponent
  }
}
