/*import * as reactRouter3 from 'react-router';

export const Link = reactRouter3.Link;

export const withRouter = reactRouter3.withRouter;*/

import React from 'react';
import { useTracking } from '../lib/analyticsEvents';
// eslint-disable-next-line no-restricted-imports
import * as reactRouter from 'react-router';
// eslint-disable-next-line no-restricted-imports
import * as reactRouterDom from 'react-router-dom';
import { HashLink } from "../components/common/HashLink";
import { parseQuery, useLocation } from './routeUtil'
import qs from 'qs'


export const withRouter = (WrappedComponent) => {
  const WithRouterWrapper = (props) => {
    return <WrappedComponent
      routes={[]}
      location={{pathname:""}}
      router={{location: {query:"", pathname:""}}}
      {...props}
    />
  }
  return reactRouterDom.withRouter(WithRouterWrapper);
}


export const Link = (props) => {
  const { captureEvent } = useTracking({eventType: "linkClicked", eventProps: {to: props.to}})
  const handleClick = (e) => {
    captureEvent(undefined, {buttonPressed: e.button})
  }

  if (!(typeof props.to === "string" || typeof props.to === "object")) {
    // eslint-disable-next-line no-console
    console.error("Props 'to' for Link components only accepts strings or objects, passed type: ", typeof props.to)
    return <span>Broken Link</span>
  }
  return <HashLink {...props} onMouseDown={handleClick}/>
}

export const QueryLink = ({query, merge=false, ...rest}) => {
  const { query: existingQuery } = useLocation()
  // Merge determines whether we do a shallow merge with the existing query parameters, or replace them completely
  const newSearchString = merge ? qs.stringify({...existingQuery, ...query}) : qs.stringify(query)
  return <reactRouterDom.Link
    {...rest}
    to={{...location, search: newSearchString}}
  />
}

export const Redirect = reactRouter.Redirect;
