import React, { useState} from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useMutate } from '../hooks/useMutate';
import { gql } from "@apollo/client";
import { useLocation } from '../../lib/routeUtil';
import Button from '@material-ui/core/Button';
import { useCurrentUser } from '../common/withUser';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    ...theme.typography.commentStyle
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
    display: 'block',
    textTransform: 'uppercase',
    width: '100%',
    height: 32,
    marginTop: 16,
    cursor: 'pointer',
    fontSize: '1rem'
  }, 
})

const PasswordResetPage = ({classes}: {
  classes: ClassesType
}) => {
  const { mutate, loading } = useMutate();
  const [useTokenResult, setUseTokenResult] = useState<any>(null)
  const { params: { token } } = useLocation()
  const [ password, setPassword ] = useState("")

  const submitFunction = async () => {
    const result = await mutate({
      mutation: gql`
        mutation useEmailToken($token: String, $args: JSON) {
          useEmailToken(token: $token, args: $args)
        }
      `,
      variables: {
        token, args: { password }
      },
      errorHandling: "flashMessageAndReturn",
    })
    if (!result.error) {
      setUseTokenResult(result.result?.data?.useEmailToken)
    }
  }
  const { SingleColumnSection, Loading } = Components;
  
  const ResultComponent = useTokenResult?.componentName && Components[useTokenResult.componentName as keyof ComponentTypes]
  return <SingleColumnSection className={classes.root}>
    {!useTokenResult && <form
      onSubmit={(ev) => {
        ev.preventDefault();
        submitFunction()
      }}
    >
      <input
        value={password} type="password" name="password"
        placeholder="new password" className={classes.input}
        onChange={event => setPassword(event.target.value)}
      />
      <Button onClick={submitFunction} className={classes.submit}>Set New Password</Button>
    </form>}
    {useTokenResult && ResultComponent && <ResultComponent {...useTokenResult.props}/>}
    {loading && <Loading/>}
  </SingleColumnSection>
}

const PasswordResetPageComponent = registerComponent("PasswordResetPage", PasswordResetPage, { styles });

declare global {
  interface ComponentTypes {
    PasswordResetPage: typeof PasswordResetPageComponent
  }
}
