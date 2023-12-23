import React, { CSSProperties, FC } from 'react';
import { useTracking } from '../lib/analyticsEvents';
// eslint-disable-next-line no-restricted-imports
import * as reactRouter from 'react-router';
// eslint-disable-next-line no-restricted-imports
import * as reactRouterDom from 'react-router-dom';
import { HashLink, HashLinkProps } from "../components/common/HashLink";
import { classifyHost, getUrlClass } from './routeUtil';
import { NavigationContext, parseQuery } from './vulcan-core/appContext'
import qs from 'qs'

type LinkProps = {
  to?: HashLinkProps['to']|null
  onMouseDown?: HashLinkProps['onMouseDown']
  onClick?: HashLinkProps['onClick']
  rel?: string
  eventProps?: Record<string, string>
  className?: string
  style?: CSSProperties,
  dangerouslySetInnerHTML?: {__html: string}
  target?: string
  smooth?: boolean,
  id?: string
  children?: React.ReactNode,
};

const isLinkValid = (props: LinkProps): props is Omit<HashLinkProps, 'dangerouslySetInnerHTML'> => {
  return typeof props.to === "string" || typeof props.to === "object";
};

export const Link = ({eventProps, ...props}: LinkProps) => {
  const { captureEvent } = useTracking({eventType: "linkClicked", eventProps: {to: props.to, ...(eventProps ?? {})}})
  const handleClick = (e: AnyBecauseTodo) => {
    captureEvent(undefined, {buttonPressed: e.button})
    props.onMouseDown && props.onMouseDown(e)
  }

  if (!isLinkValid(props)) {
    // eslint-disable-next-line no-console
    console.error("Props 'to' for Link components only accepts strings or objects, passed type: ", typeof props.to)
    return <span>Broken Link</span>
  }

  const {to, ...otherProps} = props;
  if (to && typeof to === 'string' && isOffsiteLink(to)) {
    return <a href={to} {...otherProps} onMouseDown={handleClick}/>
  } else {
    return <HashLink {...props} onMouseDown={handleClick}/>
  }
}

export const QueryLink: FC<Omit<reactRouterDom.LinkProps, "to"> & {
  query: AnyBecauseTodo,
  /**
   * Merge determines whether we do a shallow merge with the existing query
   * parameters, or replace them completely
   */
  merge?: boolean,
}> = ({
  query,
  merge=false,
  ...rest
}) => {
  const location = reactRouter.useLocation();
  const newSearchString = merge
    ? qs.stringify({...parseQuery(location), ...query})
    : qs.stringify(query);
  return <reactRouterDom.Link
    {...rest}
    to={{...location, search: newSearchString}}
  />
}

function isOffsiteLink(url: string): boolean {
  if (url.startsWith("http:") || url.startsWith("https:")) {
    const URLClass = getUrlClass();
    const parsedUrl = new URLClass(url);
    return classifyHost(parsedUrl.host) !== "onsite";
  } else {
    return false;
  }
}

export const Redirect = reactRouter.Redirect;
export { useNavigate, NavigateFunction } from './routeUtil';
