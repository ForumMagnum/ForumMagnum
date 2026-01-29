import React from 'react';
import SingleColumnSection from "./SingleColumnSection";
import ErrorMessage from "./ErrorMessage";

const ErrorPage = ({error}: {
  error: any
}) => {
  const message = error?.message ?? error ?? "Error";
  
  return <SingleColumnSection>
    <ErrorMessage message={message}/>
  </SingleColumnSection>
}

export default ErrorPage;



