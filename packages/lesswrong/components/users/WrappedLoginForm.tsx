import React, { useState } from 'react';
import { Components, registerComponent, getSetting } from '../../lib/vulcan-lib';
import withUser from '../common/withUser';
import { useClientId } from '../../lib/abTestUtil';

const WrappedLoginForm = ({ onSignedInHook, onPostSignUpHook, formState }: {
  onSignedInHook?: any,
  onPostSignUpHook?: any,
  formState?: any,
}) => {
  const [reCaptchaToken, setReCaptchaToken] = useState<any>(null);
  const clientId = useClientId();
  
  const customSignupFields = ['EAForum', 'AlignmentForum'].includes(getSetting('forumType'))
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
    {getSetting('reCaptcha.apiKey')
      && <Components.ReCaptcha verifyCallback={(token) => setReCaptchaToken(token)} action="login/signup"/>}
    <Components.AccountsLoginForm
      onPreSignUpHook={(options) => {
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
