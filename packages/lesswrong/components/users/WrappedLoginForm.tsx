import { Components, registerComponent } from '../../lib/vulcan-lib';
import React, { useState } from 'react';
import { reCaptchaSiteKeySetting } from '../../lib/publicSettings';
import { commentBodyStyles } from '../../themes/stylePiping';
import { gql, useMutation, DocumentNode } from '@apollo/client';
import { forumTypeSetting } from '../../lib/instanceSettings';
import { useMessages } from '../common/withMessages';
import { getUserABTestKey, useClientId } from '../../lib/abTestImpl';
import classnames from 'classnames'
import { useLocation } from '../../lib/routeUtil';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    ...commentBodyStyles(theme, true),
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
    backgroundColor: 'rgba(0,0,0,0.03)',
    width: '100%'
  },
  submit: {
    font: 'inherit',
    color: 'inherit',
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
      justifyContent: 'space-around'
    }
  },
  oAuthComment: {
    textAlign: 'center',
    fontSize: '0.8em',
    margin: 10
  },
  oAuthLink: {
    color: 'rgba(0,0,0,0.7) !important',
    fontSize: '0.9em',
    padding: 6,
    textTransform: 'uppercase'
  },
  toggle: {
    cursor: 'pointer',
    '&:hover': {
      color: 'rgba(0,0,0,0.5)'
    }
  }
})

const loginMutation = gql`
  mutation login($username: String, $password: String) {
    login(username: $username, password: $password) {
      token
    }
  }
`

const signupMutation = gql`
  mutation signup($email: String, $username: String, $password: String, $subscribeToCurated: Boolean, $reCaptchaToken: String, $abTestKey: String) {
    signup(email: $email, username: $username, password: $password, subscribeToCurated: $subscribeToCurated, reCaptchaToken: $reCaptchaToken, abTestKey: $abTestKey) {
      token
    }
  }
`

const passwordResetMutation = gql`
  mutation resetPassword($email: String) {
    resetPassword(email: $email)
  }
`

type possibleActions = "login" | "signup" | "pwReset"

const currentActionToMutation : Record<possibleActions, DocumentNode> = {
  login: loginMutation, 
  signup: signupMutation,
  pwReset: passwordResetMutation
}

const currentActionToButtonText : Record<possibleActions, string> = {
  login: "Log In",
  signup: "Sign Up", 
  pwReset: "Request Password Reset"
}

type WrappedLoginFormProps = {
  startingState?: possibleActions,
  classes: ClassesType
}

const WrappedLoginForm = (props: WrappedLoginFormProps) => {
  if (forumTypeSetting.get() === 'EAForum') {
    return <WrappedLoginFormEA {...props} />
  }
  return <WrappedLoginFormDefault {...props} />
}

const WrappedLoginFormDefault = ({ startingState = "login", classes }: WrappedLoginFormProps) => {
  const { SignupSubscribeToCurated } = Components;
  const [reCaptchaToken, setReCaptchaToken] = useState<any>(null);
  const [username, setUsername] = useState<string | undefined>(undefined)
  const [password, setPassword] = useState<string | undefined>(undefined)
  const [email, setEmail] = useState<string | undefined>(undefined)
  const { flash } = useMessages();
  const [currentAction, setCurrentAction] = useState<possibleActions>(startingState)
  const [subscribeToCurated, setSubscribeToCurated] = useState<boolean>(!['EAForum', 'AlignmentForum'].includes(forumTypeSetting.get()))
  const [ mutate, { error } ] = useMutation(currentActionToMutation[currentAction], { errorPolicy: 'all' })
  const clientId = useClientId();

  const submitFunction = async (e) => {
    e.preventDefault();
    const signupAbTestKey = getUserABTestKey(null, clientId);
    const variables = 
      currentAction === "signup" ? { email, username, password, reCaptchaToken, abTestKey: signupAbTestKey, subscribeToCurated } : (
      currentAction === "login" ? { username, password } :
      currentAction === "pwReset" ? { email } : {})
    const { data } = await mutate({ variables })
    if (data?.login?.token || data?.signup?.token) location.reload()
    if (data?.resetPassword) {
      flash(data?.resetPassword)
    }
  }

  return <React.Fragment>
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
      
      {currentAction === "signup" && !['EAForum', 'AlignmentForum'].includes(forumTypeSetting.get()) &&
        <SignupSubscribeToCurated defaultValue={subscribeToCurated} onChange={(checked: boolean) => setSubscribeToCurated(checked)} />
      }
      <div className={classes.options}>
        { currentAction !== "login" && <span className={classes.toggle} onClick={() => setCurrentAction("login")}> Log In </span> }
        { currentAction === "login" && <span className={classes.toggle} onClick={() => setCurrentAction("signup")}> Sign Up </span> }
        { currentAction === "pwReset" && <span className={classes.toggle} onClick={() => setCurrentAction("signup")}> Sign Up </span> }
        { currentAction !== "pwReset" && <span className={classes.toggle} onClick={() => setCurrentAction("pwReset")}> Reset Password </span> }
      </div>
      <div className={classes.oAuthComment}>...or continue with</div>
      <div className={classes.oAuthBlock}>
        <a className={classes.oAuthLink} href="/auth/facebook">FACEBOOK</a>
        <a className={classes.oAuthLink} href="/auth/google">GOOGLE</a>
        <a className={classes.oAuthLink} href="/auth/github">GITHUB</a>
        {/* Temporarily here for EA Forum testing */}
        {/* <a className={classes.oAuthLink} href="/auth/auth0">AUTH 0</a> */}
      </div>
      {/* <a href="/auth/facebook"><FacebookIcon /></a>
      <a href="/auth/github"><GithubIcon /></a> */}
      {error && <div className={classes.error}>{error.message}</div>}
    </form>
  </React.Fragment>;
}

const WrappedLoginFormEA = ({classes}: WrappedLoginFormProps) => {
  const { pathname } = useLocation()
  
  return <div className={classes.root}>
    <div className={classnames(classes.oAuthBlock, 'ea-forum')}>
      <a className={classes.oAuthLink} href={`/auth/auth0?returnTo=${pathname}`}>Login</a>
      <a className={classes.oAuthLink} href={`/auth/auth0?screen_hint=signup&returnTo=${pathname}`}>Sign Up</a>
    </div>
  </div>
}

const WrappedLoginFormComponent = registerComponent('WrappedLoginForm', WrappedLoginForm, { styles });

declare global {
  interface ComponentTypes {
    WrappedLoginForm: typeof WrappedLoginFormComponent
  }
}
