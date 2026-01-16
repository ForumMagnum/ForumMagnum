import React, { CSSProperties, FC } from 'react';
import { useTracking } from '../lib/analyticsEvents';
// eslint-disable-next-line no-restricted-imports
import * as reactRouter from 'react-router';
// eslint-disable-next-line no-restricted-imports
import * as reactRouterDom from 'react-router-dom';
import { HashLink, HashLinkProps } from "../components/common/HashLink";
import { classifyHost } from './routeUtil';
import { parseQuery } from './vulcan-core/appContext'
import qs from 'qs'
import { getUrlClass } from '@/server/utils/getUrlClass';
import { isRouteOwnedByEAForumV3 } from './stranglerFig';

export type LinkProps = {
  to?: HashLinkProps['to']|null
  doOnDown?: boolean
  onMouseEnter?: HashLinkProps['onMouseEnter']
  onMouseLeave?: HashLinkProps['onMouseLeave']
  onMouseDown?: HashLinkProps['onMouseDown']
  onClick?: HashLinkProps['onClick']
  rel?: string
  eventProps?: Record<string, string>
  className?: string
  style?: CSSProperties,
  dangerouslySetInnerHTML?: {__html: TrustedHTML}
  target?: string
  smooth?: boolean,
  id?: string
  children?: React.ReactNode,
};

const isLinkValid = (props: LinkProps): props is HashLinkProps => {
  return typeof props.to === "string" || typeof props.to === "object";
};

export const Link = ({eventProps, onClick, ...props}: LinkProps) => {
  const { captureEvent } = useTracking({
    eventType: "linkClicked",
    eventProps: {
      to: String(props.to),
      ...(eventProps ?? {}),
    },
  });
  const handleMouseDown = (e: AnyBecauseTodo) => {
    captureEvent(undefined, {buttonPressed: e.button})
    props.onMouseDown && props.onMouseDown(e)
  }

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    onClick?.(e as AnyBecauseTodo);
    if (e.defaultPrevented) return;

    // STRANGLER FIG: Check on click if route is owned by new site
    const {to} = props;
    const href = typeof to === 'string' ? to : ((to as {pathname?: string} | null)?.pathname ?? '/');
    if (isRouteOwnedByEAForumV3(href)) {
      e.preventDefault();
      window.location.href = href;
    }
  }

  if (!isLinkValid(props)) {
    // eslint-disable-next-line no-console
    console.error("Props 'to' for Link components only accepts strings or objects, passed type: ", typeof props.to)
    return <span>Broken Link</span>
  }

  const {to, ...otherProps} = props;

  if (to && typeof to === 'string' && isOffsiteLink(to)) {
    return <a href={to} {...otherProps} onClick={handleClick} onMouseDown={handleMouseDown}/>
  } else {
    return <HashLink {...props} onClick={handleClick} onMouseDown={handleMouseDown}/>
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
