import { registerComponent } from '../../lib/vulcan-lib/components';
import React, { useEffect } from 'react';
import { isServer } from '@/lib/executionEnvironment';
import { StatusCodeSetter } from '../next/StatusCodeSetter';
import { combineUrls, getSiteUrl } from '@/lib/vulcan-lib/utils';

/**
 * If this component appears in the DOM, this page is a redirect to the given
 * URL. When rendered server side, it will use the provided HTTP status (default
 * 301). The URL may be relative or absolute. If there is more than one
 * PermanentRedirect component in the component tree, behavior is undefined.
 */
const PermanentRedirect = ({url, status}: {
  url: string,
  status?: number
}) => {
  if (!url) throw Error("Permanent Redirect requires a URL")
  
  const redirectTarget = urlIsAbsolute(url) ? url : combineUrls(getSiteUrl(), url);

  // Handle redirecting to _absolute_ URLs in a client context. `useEffect`
  // only runs client side.
  useEffect(() => {
    window.location.replace(redirectTarget);
  }, [redirectTarget]);
  
  if (isServer) {
    return <StatusCodeSetter status={status ?? 301} redirectTarget={redirectTarget}/>
  }

  return null;
};

function urlIsAbsolute(url: string): boolean {
  return (url.startsWith('http://') || url.startsWith('https://'));
}

export default registerComponent('PermanentRedirect', PermanentRedirect);


