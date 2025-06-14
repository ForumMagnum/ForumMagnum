import { registerComponent } from '../../lib/vulcan-lib/components';
import React, { useEffect } from 'react';
import { useServerRequestStatus } from '../../lib/routeUtil'
import { permanentRedirect } from 'next/navigation';

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
  
  // Handle redirecting in an SSR context. `useServerRequestStatus` will be
  // null if this is not an SSR.
  const serverRequestStatus = useServerRequestStatus()
  if (serverRequestStatus) {
    serverRequestStatus.status = status || 301
    serverRequestStatus.redirectUrl = url
  }
  
  // Handle redirecting to _absolute_ URLs in a client context. `useEffect`
  // only runs client side.
  useEffect(() => {
    if(urlIsAbsolute(url)) {
      window.location.replace(url);
    }
  }, [url]);
  
  // Handle redirecting to _relative_ URLs in a client context. This forwards
  // to react-router, which only knows how to handle relative URLs not absolute
  // ones (if you give <Redirect> an absolute URL you might get something like
  // http://www.lesswrong.com/http://www.lesswrong.com/asdf).
  if(urlIsAbsolute(url)) {
    return <></>;
  } else {
    // return <Redirect to={url}/>;
    permanentRedirect(url);
  }
};

function urlIsAbsolute(url: string): boolean {
  return (url.startsWith('http://') || url.startsWith('https://'));
}

export default registerComponent('PermanentRedirect', PermanentRedirect);


