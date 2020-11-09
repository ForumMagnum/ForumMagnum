import { Components, registerComponent } from '../../lib/vulcan-lib';
import React, { useState } from 'react';
// import { useClientId } from '../../lib/abTestUtil';
import { reCaptchaSiteKeySetting } from '../../lib/publicSettings';
// import { forumTypeSetting } from '../../lib/instanceSettings';

const WrappedLoginForm = ({ onSignedInHook, onPostSignUpHook, formState }: {
  onSignedInHook?: any,
  onPostSignUpHook?: any,
  formState?: any,
}) => {
  const [reCaptchaToken, setReCaptchaToken] = useState<any>(null);
  // const clientId = useClientId();

  // const customSignupFields = ['EAForum', 'AlignmentForum'].includes(forumTypeSetting.get())
  //   ? []
  //   : [
  //     {
  //       id: "subscribeToCurated",
  //       type: 'custom',
  //       defaultValue: true,
  //       renderCustom: Components.SignupSubscribeToCurated
  //     }
  //   ]

  return <React.Fragment>
    {reCaptchaSiteKeySetting.get()
      && <Components.ReCaptcha verifyCallback={(token) => setReCaptchaToken(token)} action="login/signup"/>}
    <form action="/login" method="post">
      <div>
          <label>Username:</label>
          <input type="text" name="username"/>
      </div>
      <div>
          <label>Password:</label>
          <input type="password" name="password"/>
      </div>
      <div>
          <input type="submit" value="Log In"/>
      </div>
    </form>
  </React.Fragment>;
}

const WrappedLoginFormComponent = registerComponent('WrappedLoginForm', WrappedLoginForm);

declare global {
  interface ComponentTypes {
    WrappedLoginForm: typeof WrappedLoginFormComponent
  }
}
