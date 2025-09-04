'use client';

import React, { CSSProperties, FC, useState } from 'react';
import { useTracking } from '../lib/analyticsEvents';
import NextLink from 'next/link';
import { HashLink, HashLinkProps } from "../components/common/HashLink";
import { classifyHost, useLocation } from './routeUtil';
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
  children?: React.ReactNode,
};

const isLinkValid = (props: LinkProps): props is HashLinkProps => {
  return typeof props.to === "string" || typeof props.to === "object";
};

const isPrefetchablePostLink = (to: string) => {
  // TODO: maybe we want this to be a configurable prop at the callsite?
  return to.startsWith('/posts/') || /^\/s\/[a-z0-9]+\/p\/[a-z0-9]+$/.test(to);
};

const getLinkPrefetch = (to: string, everHovered: boolean) => {
  if (isPrefetchablePostLink(to)) {
    return true;
  }

  return everHovered ? true : false;
}

export const Link = ({eventProps, ...props}: LinkProps) => {
  const [hovered, setHovered] = useState(false);
  
  const { captureEvent } = useTracking({
    eventType: "linkClicked",
    eventProps: {
      to: String(props.to),
      ...(eventProps ?? {}),
    },
  });
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
    const prefetch = getLinkPrefetch(to, hovered);
    const propsWithPrefetch = { ...props, prefetch };
    return <HashLink {...propsWithPrefetch} onMouseDown={handleClick} onMouseEnter={() => setHovered(true)}/>
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

