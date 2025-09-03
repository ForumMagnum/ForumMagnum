import React from 'react';

export const StatusCodeSetter = ({status, redirectTarget}: {
  status: number;
  redirectTarget?: string;
}) => {
  const stringifiedMetadata = JSON.stringify({status, redirectTarget});
  const encodedMetadata = new TextEncoder().encode(stringifiedMetadata);
  const binaryString = Array.from(encodedMetadata, byte => String.fromCharCode(byte)).join('');
  const base64StringifiedMetadata = btoa(binaryString);

  return <div {...{"data-response-metadata": base64StringifiedMetadata}}/>;
}
