/*import * as reactRouter3 from 'react-router';

export const Link = reactRouter3.Link;

export const withRouter = reactRouter3.withRouter;*/

import React from 'react';

import * as reactRouter from 'react-router';
import * as reactRouterDom from 'react-router-dom';

export const withRouter = (WrappedComponent) => {
  const WithRouterWrapper = (props) => {
    return <WrappedComponent
      routes={[]}
      location={{pathname:""}}
      router={{location: {query:"", pathname:""}}}
      {...props}
    />
  }
  return reactRouter.withRouter(WithRouterWrapper);
}

export const Link = (props) => {
  return <reactRouterDom.Link {...props}/>
}

export const SetQueryLink = ({newQuery, ...rest}) => {
  return <reactRouterDom.Link
    to={loc => ({...loc, query: newQuery})}
    {...rest}
  />
}