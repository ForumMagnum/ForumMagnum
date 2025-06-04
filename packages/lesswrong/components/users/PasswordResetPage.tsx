import React, { useState} from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { useMutation, gql } from '@apollo/client';
import { useLocation } from '../../lib/routeUtil';
import Button from '@/lib/vendor/@material-ui/core/src/Button';
import type { UseEmailTokenResult } from '@/server/emails/emailTokens';
import { emailTokenResultComponents } from './emailTokens';
import SingleColumnSection from "../common/SingleColumnSection";

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
  const [emailTokenMutation] = useMutation(gql`
    mutation useEmailToken($token: String, $args: JSON) {
      useEmailToken(token: $token, args: $args)
    }
  `);
  const [useTokenResult, setUseTokenResult] = useState<UseEmailTokenResult | null>(null)
  const { params: { token } } = useLocation()
  const [ password, setPassword ] = useState("")
  const submitFunction = async () => {
    const result = await emailTokenMutation({
      variables: {token, args: { password }}
    })
    setUseTokenResult(result?.data?.useEmailToken)
  }
  const ResultComponent = useTokenResult?.componentName && emailTokenResultComponents[useTokenResult.componentName];
  
  return <SingleColumnSection className={classes.root}>
    {!useTokenResult && <> 
      <input value={password} type="password" name="password" placeholder="new password" className={classes.input} onChange={event => setPassword(event.target.value)}/>
      <Button onClick={submitFunction} className={classes.submit}>Set New Password</Button>
    </>}
    {useTokenResult && ResultComponent && <ResultComponent {...useTokenResult.props}/>}
  </SingleColumnSection>
}

export default registerComponent("PasswordResetPage", PasswordResetPage, { styles });


