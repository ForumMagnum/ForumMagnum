import React, { useEffect, useState} from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useMutate } from '../hooks/useMutate';
import { gql } from "@apollo/client";
import { useLocation } from '../../lib/routeUtil';

const EmailTokenPage = () => {
  const { Loading, SingleColumnSection } = Components
  const [useTokenResult, setUseTokenResult] = useState<any>(null)
  const { params: { token } } = useLocation()
  const { mutate, loading: emailTokenLoading } = useMutate();

  useEffect(() => {
    void (async () => {
      const mutationResult = await mutate({
        mutation: gql`
          mutation emailTokenMutation($token: String) {
            useEmailToken(token: $token)
          }
        `,
        variables: {token},
        errorHandling: "flashMessageAndReturn",
      });
      setUseTokenResult(mutationResult.result.useEmailToken);
    })();
  }, [mutate, token])
  
  const ResultComponent = useTokenResult?.componentName && Components[useTokenResult.componentName as keyof ComponentTypes]
  return <SingleColumnSection>
    {(emailTokenLoading || !ResultComponent) ? <Loading/> : <ResultComponent {...useTokenResult.props}/>}
  </SingleColumnSection>
}

const EmailTokenPageComponent = registerComponent("EmailTokenPage", EmailTokenPage);

declare global {
  interface ComponentTypes {
    EmailTokenPage: typeof EmailTokenPageComponent
  }
}
