import React, { useEffect, useState } from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { useNamedMutation } from '../../lib/crud/withMutation';
import { useLocation } from '../../lib/routeUtil';
import type { UseEmailTokenResult } from '@/server/emails/emailTokens';
import { emailTokenResultComponents } from './emailTokens';
import Loading from "../vulcan-core/Loading";
import SingleColumnSection from "../common/SingleColumnSection";

const EmailTokenPage = () => {
  const [useTokenResult, setUseTokenResult] = useState<UseEmailTokenResult | null>(null)
  const { params: { token } } = useLocation()
  const { mutate: emailTokenMutation, loading: emailTokenLoading } = useNamedMutation({name: "useEmailToken", graphqlArgs: {token: "String"}})

  useEffect(() => {
    void emailTokenMutation({token}).then(mutationResult => {
      setUseTokenResult(mutationResult.data.useEmailToken)
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  
  const ResultComponent = useTokenResult?.componentName && emailTokenResultComponents[useTokenResult.componentName];
  const props = useTokenResult?.props as AnyBecauseHard;

  return <SingleColumnSection>
    {(emailTokenLoading || !ResultComponent) ? <Loading/> : <ResultComponent {...props}/>}
  </SingleColumnSection>
}

export default registerComponent("EmailTokenPage", EmailTokenPage);
