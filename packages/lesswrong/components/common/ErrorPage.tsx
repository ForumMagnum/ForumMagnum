import React from 'react';
import { Components, registerComponent } from '@/lib/vulcan-lib/components';

const ErrorPage = ({error}: {
  error: any
}) => {
  const { SingleColumnSection, ErrorMessage } = Components;
  
  const message = error?.message ?? error ?? "Error";
  
  return <SingleColumnSection>
    <ErrorMessage message={message}/>
  </SingleColumnSection>
}

const ErrorPageComponent = registerComponent('ErrorPage', ErrorPage);

declare global {
  interface ComponentTypes {
    ErrorPage: typeof ErrorPageComponent
  }
}

