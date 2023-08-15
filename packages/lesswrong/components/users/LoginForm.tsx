import { Components, registerComponent } from '../../lib/vulcan-lib';
import React, { useState } from 'react';
import { reCaptchaSiteKeySetting } from '../../lib/publicSettings';
import { gql, useMutation, DocumentNode } from '@apollo/client';
import { forumTypeSetting } from '../../lib/instanceSettings';
import { useMessages } from '../common/withMessages';
import { getUserABTestKey, useClientId } from '../../lib/abTestImpl';
import classnames from 'classnames'
import { useLocation } from '../../lib/routeUtil';
import type { GraphQLError } from 'graphql';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    wordBreak: "normal",
    padding: 16,
    marginTop: 0,
    marginBottom: 0,
    width: 252
  }, 
  input: {
    font: 'inherit',
    color: 'inherit',
    display: 'block',
    fontSize: '1.2rem',
    marginBottom: 8,
    padding: 8,
    backgroundColor: theme.palette.panelBackground.darken03,
    width: '100%'
  },
  submit: {
    font: 'inherit',
    color: 'inherit',
    background: theme.palette.grey[200],
    display: 'block',
    textTransform: 'uppercase',
    width: '100%',
    height: 32,
    marginTop: 16,
    cursor: 'pointer',
    fontSize: '1rem'
  }, 
  error: {
    padding: 8,
    color: theme.palette.error.main 
  },
  options: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '1rem',
    marginTop: 4,
    padding: 4
  },
  oAuthBlock: {
    display: 'flex',
    justifyContent: 'space-between',
    '&.ea-forum': {
      maxWidth: 400,
      justifyContent: 'space-around',
      padding: '8px 20px',
    }
  },
  oAuthComment: {
    textAlign: 'center',
    fontSize: '0.8em',
    margin: 10
  },
  oAuthLink: {
    color: `${theme.palette.text.slightlyDim2} !important`,
    fontSize: '0.9em',
    padding: 6,
    textTransform: 'uppercase'
  },
  primaryBtn: {
    background: theme.palette.primary.main,
    color: `${theme.palette.buttons.primaryDarkText} !important`,
    fontSize: '0.9em',
    padding: '6px 12px',
    textTransform: 'uppercase',
    borderRadius: 4
  },
  toggle: {
    cursor: 'pointer',
    '&:hover': {
      color: theme.palette.link.dim,
    }
  }
})

type possibleActions = "login" | "signup" | "pwReset"

const currentActionToButtonText : Record<possibleActions, string> = {
  login: "Log In",
  signup: "Sign Up",
  pwReset: "Request Password Reset"
}

type WrappedLoginFormProps = {
  startingState?: possibleActions,
  immediateRedirect?: boolean,
  classes: ClassesType
}

const WrappedLoginForm = (props: WrappedLoginFormProps) => {
  if (forumTypeSetting.get() === 'EAForum') {
    return <WrappedLoginFormEA {...props} />
  }
  return <WrappedLoginFormDefault {...props} />
}

const WrappedLoginFormDefault = ({ startingState = "login", classes }: WrappedLoginFormProps) => {
  const hasSubscribeToCuratedCheckbox = !['EAForum', 'AlignmentForum'].includes(forumTypeSetting.get());
  const hasOauthSection = forumTypeSetting.get() !== 'EAForum';

  const { pathname } = useLocation()
  const { SignupSubscribeToCurated } = Components;
  const [reCaptchaToken, setReCaptchaToken] = useState<any>(null);
  const [username, setUsername] = useState<string>("")
  const [password, setPassword] = useState<string>("")
  const [email, setEmail] = useState<string>("")
  const { flash } = useMessages();
  const [currentAction, setCurrentAction] = useState<possibleActions>(startingState)
  const [subscribeToCurated, setSubscribeToCurated] = useState<boolean>(hasSubscribeToCuratedCheckbox)

  const [loginMutation] = useMutation(gql`
    mutation login($username: String, $password: String) {
      login(username: $username, password: $password) {
        token
      }
    }
  `, { errorPolicy: 'all' })

  const [signupMutation] = useMutation(gql`
    mutation signup($email: String, $username: String, $password: String, $subscribeToCurated: Boolean, $reCaptchaToken: String, $abTestKey: String) {
      signup(email: $email, username: $username, password: $password, subscribeToCurated: $subscribeToCurated, reCaptchaToken: $reCaptchaToken, abTestKey: $abTestKey) {
        token
      }
    }
  `, { errorPolicy: 'all' })

  const [pwResetMutation] = useMutation(gql`
    mutation resetPassword($email: String) {
      resetPassword(email: $email)
    }
  `, { errorPolicy: 'all' })

  const [displayedError, setDisplayedError] = useState<string|null>(null);
  const clientId = useClientId();

  const showErrors = (errors: readonly GraphQLError[]) => {
    setDisplayedError(errors.map(err => err.message).join('.\n'));
  }
  
  const submitFunction = async (e: AnyBecauseTodo) => {
    e.preventDefault();
    const signupAbTestKey = getUserABTestKey(null, clientId);

    if (currentAction === 'login') {
      const { data, errors } = await loginMutation({
        variables: { username, password }
      })
      if (errors) {
        showErrors(errors);
      }
      if (data?.login?.token || data?.signup?.token) {
        location.reload()
      }
    } else if (currentAction === 'signup') {
      const { data, errors } = await signupMutation({
        variables: {
          email, username, password,
          reCaptchaToken,
          abTestKey: signupAbTestKey,
          subscribeToCurated
        }
      })
      if (errors) {
        showErrors(errors);
      }
    } else if (currentAction === 'pwReset') {
      const { data, errors } = await pwResetMutation({
        variables: { email }
      })
      if (errors) {
        showErrors(errors);
      }
      if (data?.resetPassword) {
        flash(data?.resetPassword)
      }
    }
  }

  return <Components.ContentStyles contentType="commentExceptPointerEvents">
    {reCaptchaSiteKeySetting.get()
      && <Components.ReCaptcha verifyCallback={(token) => setReCaptchaToken(token)} action="login/signup"/>}
    <form className={classes.root} onSubmit={submitFunction}>
      {["signup", "pwReset"].includes(currentAction) && <input value={email} type="text" name="email" placeholder="email" className={classes.input} onChange={event => setEmail(event.target.value)} />}
      {["signup", "login"].includes(currentAction) && <>
        <input value={username} type="text" name="username" placeholder={currentAction === "signup" ? "username" : "username or email"} className={classes.input} onChange={event => setUsername(event.target.value)}/>
        <input
          value={password} type="password" name="password"
          placeholder={(currentAction==="signup") ? "create password" : "password"}
          className={classes.input}
          onChange={event => setPassword(event.target.value)}
        />
      </>}
      <input type="submit" className={classes.submit} value={currentActionToButtonText[currentAction]} />
      
      {currentAction === "signup" && hasSubscribeToCuratedCheckbox &&
        <SignupSubscribeToCurated defaultValue={subscribeToCurated} onChange={(checked: boolean) => setSubscribeToCurated(checked)} />
      }
      <div className={classes.options}>
        {currentAction !== "login" && <span className={classes.toggle} onClick={() => setCurrentAction("login")}> Log In </span>}
        {currentAction !== "signup" && <span className={classes.toggle} onClick={() => setCurrentAction("signup")}> Sign Up </span>}
        {currentAction !== "pwReset" && <span className={classes.toggle} onClick={() => setCurrentAction("pwReset")}> Reset Password </span>}
      </div>
      {hasOauthSection && <>
        <div className={classes.oAuthComment}>...or continue with</div>
        <div className={classes.oAuthBlock}>
          <a className={classes.oAuthLink} href={`/auth/facebook?returnTo=${pathname}`}>FACEBOOK</a>
          <a className={classes.oAuthLink} href={`/auth/google?returnTo=${pathname}`}>GOOGLE</a>
          <a className={classes.oAuthLink} href={`/auth/github?returnTo=${pathname}`}>GITHUB</a>
        </div>
      </>}
      {displayedError && <div className={classes.error}>{displayedError}</div>}
    </form>
  </Components.ContentStyles>;
}

const WrappedLoginFormEA = ({startingState, immediateRedirect, classes}: WrappedLoginFormProps) => {
  const { pathname, query } = useLocation()
  const returnUrl = `${pathname}?${new URLSearchParams(query).toString()}`;
  const returnTo = encodeURIComponent(returnUrl);

  const urls: AnyBecauseTodo = {
    login: `/auth/auth0?returnTo=${returnTo}`,
    signup: `/auth/auth0?screen_hint=signup&returnTo=${returnTo}`,
  };

  if (immediateRedirect) {
    window.location.href = urls[startingState ?? "login"];
    return <Components.Loading />;
  }

  return <Components.ContentStyles contentType="commentExceptPointerEvents">
    <div className={classnames(classes.oAuthBlock, 'ea-forum')}>
      <a className={startingState === 'login' ? classes.primaryBtn : classes.oAuthLink}
        href={urls.login}>Login</a>
      <a className={startingState === 'signup' ? classes.primaryBtn : classes.oAuthLink}
        href={urls.signup}>Sign Up</a>
    </div>
  </Components.ContentStyles>
}

const WrappedLoginFormComponent = registerComponent('WrappedLoginForm', WrappedLoginForm, { styles });

declare global {
  interface ComponentTypes {
    WrappedLoginForm: typeof WrappedLoginFormComponent
  }
}
