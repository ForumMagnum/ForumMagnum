import React from 'react';
import { registerComponent } from '@/lib/vulcan-lib/components';
import { SingleColumnSection } from "./SingleColumnSection";
import { ErrorMessage } from "./ErrorMessage";

const ErrorPageInner = ({error}: {
  error: any
}) => {
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

