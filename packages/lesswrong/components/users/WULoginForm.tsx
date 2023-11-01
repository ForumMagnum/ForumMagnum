import { Components, registerComponent } from '../../lib/vulcan-lib';
import React, { useState } from 'react';
import { gql, useMutation, DocumentNode, ApolloError } from '@apollo/client';
import classNames from 'classnames';
import OTPInput from './OTPInput';
import SimpleSchema from 'simpl-schema';
import { cdnAssetUrl } from '../../lib/routeUtil';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    wordBreak: "normal",
    padding: 16,
    marginTop: 0,
    marginBottom: 0,
    width: "30rem",
    minHeight: "2.8125rem",
    marginLeft: "50%",
    transform: "translateX(-50%)",
    textAlign: "center",
    maxWidth: "100%",
  },
  input: {
    font: 'inherit',
    color: 'inherit',
    display: 'block',
    fontSize: '1.2rem',
    padding: 8,
    backgroundColor: theme.palette.panelBackground.default,
    width: '100%',
    height: 45,
  },
  submit: {
    font: 'inherit',
    color: theme.palette.text.alwaysWhite,
    background: theme.palette.primary.main,
    display: 'block',
    height: '100%',
    cursor: 'pointer',
    fontSize: '1rem',
    padding: '12px 30px',
  },
  enterCodeSubmit: {
    display: 'inline-block',
    marginTop: 16,
    width: 290,
  },
  error: {
    padding: 8,
    color: theme.palette.error.main,
    marginLeft: -90,
    marginRight: -90,
    [theme.breakpoints.down('sm')]: {
      marginLeft: 0,
      marginRight: 0
    }
  },
  options: {
    display: 'flex',
    justifyContent: 'center',
    fontSize: '1rem',
    marginTop: 10,
    padding: 4
  },
  splashLogo: {
    height: 'auto',
  },
  heading: {
    marginTop: "1.4rem !important",
    marginBottom: 20,
    fontWeight: "700 !important",
    color: "#222 !important",
  },
  topInstructions: {
    marginLeft: '-20px',
    marginRight: '-20px',
    marginBottom: 8,
    [theme.breakpoints.down('sm')]: {
      marginLeft: 0,
      marginRight: 0
    }
  },
  hideSm: {
    [theme.breakpoints.down('sm')]: {
      display: 'none'
    }
  },
  emailAndButton: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
  },
  instructions: {
    fontSize: '1.3rem',
    marginBottom: 8
  },
  otpInput: {
    appearance: 'textfield',
    background: 'rgb(255, 255, 255)',
    borderRadius: '0.25rem',
    border: '1px solid rgba(0, 0, 0, 0.3)',
    color: 'rgb(14, 21, 41)',
    fontSize: '1.0625rem',
    height: 45,
    width: 62,
    lineHeight: '1.235',
    minWidth: '0px',
    padding: '0px 0.75rem',
    textAlign: 'center'
  },
  otpContainer: {
    justifyContent: 'center',
    gap: '5px',
  },
  returnToLogin: {
    display: 'block',
    textDecoration: 'underline',
    marginTop: 6,
    '&:visited': {
      color: theme.palette.text.primary + ' !important'
    }
  }
})

const requestLoginCodeMutation = gql`
  mutation requestLoginCode($email: String) {
    requestLoginCode(email: $email) {
      result
    }
  }
`

const codeLoginMutation = gql`
  mutation codeLogin($email: String, $code: String) {
    codeLogin(email: $email, code: $code) {
      token
    }
  }
`

const currentActionToMutation : Record<possibleActions, DocumentNode> = {
  requestCode: requestLoginCodeMutation, 
  enterCode: codeLoginMutation,
}

type possibleActions = "requestCode" | "enterCode"

const currentActionToButtonText : Record<possibleActions, string> = {
  requestCode: "Next",
  enterCode: "Next"
}

type WULoginFormProps = {
  startingState?: possibleActions,
  immediateRedirect?: boolean,
  classes: ClassesType
}

export const WULoginForm = ({ startingState = "requestCode", classes }: WULoginFormProps) => {
  const [email, setEmail] = useState<string>("")
  const [oneTimeCode, setOneTimeCode] = useState<string>("")
  const [currentAction, setCurrentAction] = useState<possibleActions>(startingState)
  const [ mutate, { error } ] = useMutation(currentActionToMutation[currentAction], { errorPolicy: 'all' })
  const [showValidationWarning, setShowValidationWarning] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(false)

  const { Loading } = Components;

  const submitFunction = async (e: AnyBecauseTodo) => {
    e.preventDefault();
    if (!SimpleSchema.RegEx.Email.test(email)) {
      setShowValidationWarning(true);
      return false;
    }

    setLoading(true);

    const variables = { email, code: oneTimeCode }
    const { data } = await mutate({ variables })

    setLoading(false);

    if (data?.requestLoginCode?.result === "success") {
      setCurrentAction("enterCode")
    }
    if (data?.codeLogin?.token) location.reload()
  }

  return <Components.ContentStyles contentType="commentExceptPointerEvents">
    <form className={classes.root} onSubmit={submitFunction}>
      <img src={cdnAssetUrl("SplashLogo.png")} alt="logo" width="358px" height="97px" className={classes.splashLogo} />
      <h1 className={classes.heading}>Sign in</h1>
      {currentAction === "requestCode" && <>
        <p className={classes.topInstructions}>Enter the email associated with your account,<br className={classes.hideSm} /> and we’ll send you a code to sign in to the community.</p>
        {!error && <div className={classes.emailAndButton}>
          <input value={email} type="email" name="email" placeholder={"Email Address"} className={classes.input} onChange={event => setEmail(event.target.value)}/>
          <input type="submit" className={classes.submit} value={currentActionToButtonText[currentAction]} />
        </div>}
        {showValidationWarning && <div className={classes.error}>
          Please enter a valid email address
        </div>}
      </>}
      {currentAction === "enterCode" && <>
        <p className={classes.instructions}>We have sent a four-digit verification code to {email}. Please enter it below.</p>
        <p>(The staging server doesn't send emails yet. You can use the test code: 1234)</p>
        <OTPInput
          inputStyle={classes.otpInput}
          containerStyle={classes.otpContainer}
          numInputs={4}
          onChange={setOneTimeCode}
          renderSeparator={<span>&nbsp;</span>}
          value={oneTimeCode}
          inputType={'tel'}
          renderInput={(props) => <input {...props} />}
          shouldAutoFocus
        />
        <input type="submit" className={classNames(classes.submit, classes.enterCodeSubmit)} value={currentActionToButtonText[currentAction]} />
      </>}

      {error && <div className={classes.error}>{error.message}</div>}
      {(error || currentAction === "enterCode") && <a href="/" className={classes.returnToLogin}>Return to login</a>}
      {loading && <Loading />}
    </form>
  </Components.ContentStyles>;
}

const WULoginFormComponent = registerComponent('WULoginForm', WULoginForm, { styles });

declare global {
  interface ComponentTypes {
    WULoginForm: typeof WULoginFormComponent
  }
}
