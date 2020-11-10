import { Components, registerComponent } from '../../lib/vulcan-lib';
import React, { useState } from 'react';
// import { useClientId } from '../../lib/abTestUtil';
import { reCaptchaSiteKeySetting } from '../../lib/publicSettings';
import { commentBodyStyles } from '../../themes/stylePiping';
// import { forumTypeSetting } from '../../lib/instanceSettings';

const styles = theme => ({
  root: {
    ...commentBodyStyles(theme),
    padding: 16,
    marginTop: 0,
    marginBottom: 0
  }, 
  input: {
    font: 'inherit',
    color: 'inherit',
    display: 'block',
    fontSize: '1.4rem',
    marginBottom: 8,
    padding: 8,
    backgroundColor: 'rgba(0,0,0,0.03)',
  },
  submit: {
    font: 'inherit',
    color: 'inherit',
    display: 'block',
    textTransform: 'uppercase',
    width: '100%',
    height: 32,
    marginTop: 16,
    cursor: 'pointer'
  }
})


const WrappedLoginForm = ({ onSignedInHook, onPostSignUpHook, formState, classes }: {
  onSignedInHook?: any,
  onPostSignUpHook?: any,
  formState?: any,
  classes: ClassesType
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
    <form action="/login" method="post" className={classes.root}>
      <input type="text" name="username" placeholder="username or email" className={classes.input}/>
      <input type="password" name="password" placeholder="password" className={classes.input}/>
      <input type="submit" value="Sign In" className={classes.submit}/>
    </form>
  </React.Fragment>;
}

const WrappedLoginFormComponent = registerComponent('WrappedLoginForm', WrappedLoginForm, { styles });

declare global {
  interface ComponentTypes {
    WrappedLoginForm: typeof WrappedLoginFormComponent
  }
}
