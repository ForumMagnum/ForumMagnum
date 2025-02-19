import React, { useState} from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useNamedMutation } from '../../lib/crud/withMutation';
import { useLocation } from '../../lib/routeUtil';
import Button from '@material-ui/core/Button';

const styles = (theme: ThemeType) => ({
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
  classes: ClassesType<typeof styles>
}) => {
  const { mutate: emailTokenMutation } = useNamedMutation({name: "useEmailToken", graphqlArgs: {token: "String", args: "JSON"}})
  const [useTokenResult, setUseTokenResult] = useState<any>(null)
  const { params: { token } } = useLocation()
  const [ password, setPassword ] = useState("")
  const submitFunction = async () => {
    const result = await emailTokenMutation({token, args: { password }})
    setUseTokenResult(result?.data?.useEmailToken)
  }
  const { SingleColumnSection } = Components;
  
  const ResultComponent = useTokenResult?.componentName && Components[useTokenResult.componentName as keyof ComponentTypes]
  return <SingleColumnSection className={classes.root}>
    {!useTokenResult && <> 
      <input value={password} type="password" name="password" placeholder="new password" className={classes.input} onChange={event => setPassword(event.target.value)}/>
      <Button onClick={submitFunction} className={classes.submit}>Set New Password</Button>
    </>}
    {useTokenResult && ResultComponent && <ResultComponent {...useTokenResult.props}/>}
  </SingleColumnSection>
}

const PasswordResetPageComponent = registerComponent("PasswordResetPage", PasswordResetPage, { styles });

declare global {
  interface ComponentTypes {
    PasswordResetPage: typeof PasswordResetPageComponent
  }
}
