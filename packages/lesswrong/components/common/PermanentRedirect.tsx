'use client';

import { registerComponent } from '../../lib/vulcan-lib/components';
import React, { useEffect } from 'react';
import { isServer } from '@/lib/executionEnvironment';
import { StatusCodeSetter } from '../next/StatusCodeSetter';
import { useNavigate } from '@/lib/routeUtil';

/**
 * If this component appears in the DOM, this page is a redirect to the given
 * URL. When rendered server side, it will use the provided HTTP status (default
 * 308). The URL may be relative or absolute. If there is more than one
 * PermanentRedirect component in the component tree, behavior is undefined.
 */
const PermanentRedirect = ({url, status}: {
  url: string,
  status?: number
}) => {
  const navigate = useNavigate();
  
  if (!url) throw Error("Permanent Redirect requires a URL")

  useEffect(() => {
    navigate(url, { replace: true });
  }, [url, navigate]);
  
  if (isServer) {
    return <StatusCodeSetter status={status ?? 308} redirectTarget={url}/>
  }

  return null;
};

export default registerComponent('PermanentRedirect', PermanentRedirect);


