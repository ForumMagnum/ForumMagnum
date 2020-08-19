import { Components, registerComponent } from '../../lib/vulcan-lib';
import React, { useState } from 'react';
import { useClientId } from '../../lib/abTestUtil';
import { reCaptchaSiteKeySetting } from '../../lib/publicSettings';
import { forumTypeSetting } from '../../lib/instanceSettings';

const WrappedLoginForm = ({ onSignedInHook, onPostSignUpHook, formState }: {
  onSignedInHook?: any,
  onPostSignUpHook?: any,
  formState?: any,
}) => {
  const [reCaptchaToken, setReCaptchaToken] = useState<any>(null);
  const clientId = useClientId();

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
      && <Components.ReCaptcha verifyCallback={(token) => setReCaptchaToken(token)} action="login/signup"/>}
    <Components.AccountsLoginForm
      onPreSignUpHook={(options) => {
        // Add the ReCaptcha token and clientId to the user when they sign up
        return {...options, profile: {...options.profile, reCaptchaToken, clientId}}
      }}
      customSignupFields={customSignupFields}
      onSignedInHook={onSignedInHook}
      onPostSignUpHook={onPostSignUpHook}
      formState={formState}
    />
  </React.Fragment>;
}

const WrappedLoginFormComponent = registerComponent('WrappedLoginForm', WrappedLoginForm);

declare global {
  interface ComponentTypes {
    WrappedLoginForm: typeof WrappedLoginFormComponent
  }
}
