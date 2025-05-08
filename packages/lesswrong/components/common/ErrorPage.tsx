import React from 'react';
import { Components, registerComponent } from '@/lib/vulcan-lib/components';

const ErrorPageInner = ({error}: {
  error: any
}) => {
  const { SingleColumnSection, ErrorMessage } = Components;
  
  const message = error?.message ?? error ?? "Error";
  
  return <SingleColumnSection>
    <ErrorMessage message={message}/>
  </SingleColumnSection>
}

export const ErrorPage = registerComponent('ErrorPage', ErrorPageInner);

declare global {
  interface ComponentTypes {
    ErrorPage: typeof ErrorPage
  }
}

