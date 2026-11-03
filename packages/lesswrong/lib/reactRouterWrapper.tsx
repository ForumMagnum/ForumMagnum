'use client';

import React, { CSSProperties, FC } from 'react';
import { useTracking } from '../lib/analyticsEvents';
import NextLink from 'next/link';
import { HashLink, HashLinkProps } from "../components/common/HashLink";
import { classifyHost, useLocation, usePrefetchRoute } from './routeUtil';
import qs from 'qs'
import { getUrlClass } from '@/server/utils/getUrlClass';

export type LinkProps = {
  to: HashLinkProps['to']|null
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
  scroll?: boolean
  title?: string
  children?: React.ReactNode,
};

const isLinkValid = (props: LinkProps): props is HashLinkProps => {
  return typeof props.to === "string" || typeof props.to === "object";
};

const isPrefetchablePostLink = (to: string) => {
  // TODO: maybe we want this to be a configurable prop at the callsite?
  return to.startsWith('/posts/') || /^\/s\/[a-z0-9]+\/p\/[a-z0-9]+$/.test(to);
};

export const Link = ({eventProps, ...props}: LinkProps) => {
  
  const { captureEvent } = useTracking({
    eventType: "linkClicked",
    eventProps: {
      to: String(props.to),
      ...(eventProps ?? {}),
    },
  });
  const prefetchRoute = usePrefetchRoute();
  const handleClick = (e: AnyBecauseTodo) => {
    captureEvent(undefined, {buttonPressed: e.button})
    props.onMouseDown && props.onMouseDown(e)
  }
  // Viewport-based prefetching (nextjs's default) is disabled for all links,
  // but for post links we prefetch the route's static shell on hover/touch, so
  // that clicking through renders the post page's loading state (which shows
  // the post, if it's in the apollo cache) without waiting for the server.
  const prefetchIfPostLink = () => {
    if (typeof props.to === 'string' && isPrefetchablePostLink(props.to)) {
      prefetchRoute(props.to);
    }
  }
  const handleMouseEnter = (e: React.MouseEvent<HTMLAnchorElement>) => {
    props.onMouseEnter?.(e);
    prefetchIfPostLink();
  }

  if (!isLinkValid(props)) {
    // eslint-disable-next-line no-console
    console.error("Props 'to' for Link components only accepts strings or objects, passed type: ", typeof props.to)
    return <span>Broken Link</span>
  }

  // These navigation options are only used by HashLink, not native anchors.
  const {to, smooth, doOnDown, scroll, ...otherProps} = props;
  if (to && typeof to === 'string' && isOffsiteLink(to)) {
    return <a href={to} {...otherProps} onMouseDown={handleClick}/>
  } else {
    return <HashLink
      {...props}
      prefetch={false}
      onMouseDown={handleClick}
      onMouseEnter={handleMouseEnter}
      onTouchStart={prefetchIfPostLink}
    />
  }
}

export const QueryLink: FC<Omit<LinkProps, "to"> & {
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
  const { pathname, query: currentQuery, hash } = useLocation();

  const newSearchString = merge
    ? qs.stringify({...currentQuery, ...query})
    : qs.stringify(query);
  
  const url = `${pathname}${newSearchString ? `?${newSearchString}` : ''}${hash ? hash : ''}`;
  return <NextLink
    {...rest}
    prefetch={false}
    href={url}
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

