import React, {Component, useEffect, useState} from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useNamedMutation, withMutation } from '../../lib/crud/withMutation';
import { useLocation, withLocation } from '../../lib/routeUtil';
import { gql, useMutation, useQuery } from '@apollo/client';

type ComponentNameAndProps = { componentName: string, props: Record<string,any> };
interface EmailTokenPageProps extends WithLocationProps {
  useEmailToken: any,
}
interface EmailTokenPageState {
  loading: boolean,
  useTokenResult: ComponentNameAndProps|null,
}

const getTokenParamsQuery = gql`
  query getTokenParams($token: String) {
    getTokenParams(token: $token) {
      params
    }
  }
`

const EmailTokenPage = () => {
  const { Loading } = Components
  const [useTokenResult, setUseTokenResult] = useState<any>(null)
  const { params: { token } } = useLocation()
  const { mutate: useEmailTokenMutation, loading: useEmailTokenLoading } = useNamedMutation({name: "useEmailToken", graphqlArgs: {token: "String"}})
  const { data: tokenParams, loading } = useQuery(getTokenParamsQuery)

  useEffect(() => {
    useEmailTokenMutation({token}).then(mutationResult => {
      setUseTokenResult(mutationResult.data.useEmailToken)
    })
  }, [])
  
  if (loading || useEmailTokenLoading) return <Loading />
  const handlerComponentName = tokenParams?.getTokenParams?.params?.handlerComponentName
  if (handlerComponentName) {
    const HandlerComponent = Components[handlerComponentName]
    return <HandlerComponent params={tokenParams} token={token}/>
  } 
  if (useTokenResult) {
    const ResultComponent = Components[useTokenResult.componentName];
    return <ResultComponent {...useTokenResult.props}/>
  }
  return null
}

const EmailTokenPageComponent = registerComponent("EmailTokenPage", EmailTokenPage);

declare global {
  interface ComponentTypes {
    EmailTokenPage: typeof EmailTokenPageComponent
  }
}
