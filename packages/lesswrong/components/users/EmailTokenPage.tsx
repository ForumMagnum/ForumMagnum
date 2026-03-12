"use client";
import React, { useEffect, useState} from 'react';
import type { UseEmailTokenResult } from '@/server/emails/emailTokens';
import { emailTokenResultComponents } from './emailTokens';
import Loading from "../vulcan-core/Loading";
import SingleColumnSection from "../common/SingleColumnSection";
import { useMutation } from "@apollo/client/react";
import { gql } from '@/lib/generated/gql-codegen';

const EmailTokenPage = ({token}: {token: string}) => {
  const [useTokenResult, setUseTokenResult] = useState<UseEmailTokenResult | null>(null)
  const [emailTokenMutation, { loading: emailTokenLoading }] = useMutation(gql(`
    mutation useEmailToken($token: String) {
      useEmailToken(token: $token)
    }
  `));

  useEffect(() => {
    void emailTokenMutation({ variables: { token }}).then(mutationResult => {
      setUseTokenResult(mutationResult.data?.useEmailToken)
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  
  const ResultComponent = useTokenResult?.componentName && emailTokenResultComponents[useTokenResult.componentName];

  return <SingleColumnSection>
    {(emailTokenLoading || !ResultComponent) ? <Loading/> : <ResultComponent {...useTokenResult.props}/>}
  </SingleColumnSection>
}

export default EmailTokenPage;
