import React, { useEffect, useState} from 'react';
import { useMutation, gql } from '@apollo/client';
import { useLocation } from '../../lib/routeUtil';
import type { UseEmailTokenResult } from '@/server/emails/emailTokens';
import { emailTokenResultComponents } from './emailTokens';
import Loading from "../vulcan-core/Loading";
import SingleColumnSection from "../common/SingleColumnSection";

const EmailTokenPage = () => {
  const [useTokenResult, setUseTokenResult] = useState<UseEmailTokenResult | null>(null)
  const { params: { token } } = useLocation()
  const [emailTokenMutation, {loading: emailTokenLoading}] = useMutation(gql`
    mutation useEmailToken($token: String) {
      useEmailToken(token: $token)
    }
  `);

  useEffect(() => {
    void (async () => {
      const mutationResult = await emailTokenMutation({
        variables: {token}
      });
      setUseTokenResult(mutationResult.data.useEmailToken);
    })();
  }, [token, emailTokenMutation])
  
  const ResultComponent = useTokenResult?.componentName && emailTokenResultComponents[useTokenResult.componentName];

  return <SingleColumnSection>
    {(emailTokenLoading || !ResultComponent) ? <Loading/> : <ResultComponent {...useTokenResult.props}/>}
  </SingleColumnSection>
}

export default EmailTokenPage;


