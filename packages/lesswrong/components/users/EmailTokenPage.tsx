import React, { useEffect, useState} from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useNamedMutation } from '../../lib/crud/withMutation';
import { useLocation } from '../../lib/routeUtil';

const EmailTokenPage = () => {
  const { Loading, SingleColumnSection } = Components
  const [useTokenResult, setUseTokenResult] = useState<any>(null)
  const { params: { token } } = useLocation()
  const { mutate: emailTokenMutation, loading: emailTokenLoading } = useNamedMutation({name: "useEmailToken", graphqlArgs: {token: "String"}})

  useEffect(() => {
    void emailTokenMutation({token}).then(mutationResult => {
      setUseTokenResult(mutationResult.data.useEmailToken)
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  
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
