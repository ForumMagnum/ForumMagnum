import React from 'react';

export const StatusCodeSetter = ({status}: {
  status: number
}) => {
  return <div {...{"data-response-status": status}}/>
}
