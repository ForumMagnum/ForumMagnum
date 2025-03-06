import React from 'react';
import { Components, registerComponent } from '@/lib/vulcan-lib/components';
import SingleColumnSection from "@/components/common/SingleColumnSection";
import ErrorMessage from "@/components/common/ErrorMessage";

const ErrorPage = ({error}: {
  error: any
}) => {
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

export default ErrorPageComponent;

