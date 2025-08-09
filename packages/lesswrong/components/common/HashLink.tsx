// Modified From: https://github.com/rafrex/react-router-hash-link/blob/master/src/index.js

import React from 'react';
import PropTypes from 'prop-types';
// eslint-disable-next-line no-restricted-imports
import Link, { type LinkProps } from 'next/link';
import { useNavigate } from '@/lib/routeUtil';
import { isClient } from '@/lib/executionEnvironment';
import bowser from 'bowser';

type ScrollFunction = ((el: HTMLElement) => void);

export type HashLinkProps = {
  to: string
  anchorRef?: React.Ref<HTMLAnchorElement>
  id?: string,
  nofollow?: boolean,
  target?: string,
  doOnDown?: boolean
  onMouseDown?: React.MouseEventHandler<HTMLAnchorElement>
  onMouseEnter?: React.MouseEventHandler<HTMLAnchorElement>
  onMouseLeave?: React.MouseEventHandler<HTMLAnchorElement>
  onClick?: React.MouseEventHandler<HTMLAnchorElement>
  scroll?: ScrollFunction,
  smooth?: boolean
  children?: React.ReactNode,
  prefetch?: LinkProps['prefetch']
};

let hashFragment = '';
let observer: null | MutationObserver = null;
let asyncTimerId: null | number = null;
let scrollFunction: null | ScrollFunction = null;

function reset() {
  hashFragment = '';
  if (observer) {observer.disconnect();}
  if (asyncTimerId !== null) {
    window.clearTimeout(asyncTimerId);
    asyncTimerId = null;
  }
}

function getElAndScroll() {
  const element = document.getElementById(hashFragment);
  if (element !== null && scrollFunction !== null) {
    scrollFunction(element);
    reset();
    return true;
  }
  return false;
}

function hashLinkScroll() {
  // Push onto callback queue so it runs after the DOM is updated
  window.setTimeout(() => {
    if (getElAndScroll() === false) {
      if (observer === null) {
        // We check for mutations of the DOM in order to scroll correctly to elements that are only rendered after a bit of a delay
        observer = new MutationObserver(getElAndScroll);
      }
      observer.observe(document, {
        attributes: true,
        childList: true,
        subtree: true,
      });
      // if the element doesn't show up in 10 seconds, stop checking
      asyncTimerId = window.setTimeout(() => {
        reset();
      }, 10000);
    }
  }, 0);
}

export function HashLink(props: HashLinkProps) {
  const navigate = useNavigate();
  const isIOS = isClient && bowser.ios;

  function handleClick(e: React.MouseEvent<HTMLAnchorElement>) {
    reset();
    if (props.onClick) props.onClick(e);
    hashFragment = props.to
      .split('#')
      .slice(1)
      .join('#');
    if (hashFragment !== '') {
      scrollFunction =
        props.scroll ||
        (el =>
          props.smooth
            ? el.scrollIntoView({ behavior: "smooth" })
            : el.scrollIntoView());
      hashLinkScroll();
    }
  }
  const { anchorRef, scroll, smooth, children, doOnDown, to, ...filteredProps } = props;
  if (doOnDown && !isIOS && !filteredProps.target) {
    return <Link
      {...filteredProps}
      ref={anchorRef}
      href={to}
      onMouseDown={(ev) => {
        // Run any custom onMouseDown logic, including event tracking (such as that passed in from `Link`) before checking for modifier keys
        // This is necessary to capture e.g. `linkClicked` events when cmd-clicking to open links in a new tab
        filteredProps.onMouseDown?.(ev);
        if (ev.metaKey || ev.altKey || ev.ctrlKey || ev.shiftKey || ev.button !== 0) {
          return;
        }
        navigate(to);
        ev.preventDefault();
      }}
      onClick={(ev) => {
        if (doOnDown) {
          ev.preventDefault();
        }
      }}
    >
      {props.children}
    </Link>
  } else {
    return <Link href={to} ref={anchorRef} {...filteredProps} onClick={handleClick}>
      {props.children}
    </Link>
  }
}

export function getHashLinkOnClick(props: HashLinkProps) {
  function handleClick(e: React.MouseEvent<HTMLAnchorElement>) {
    reset();
    if (props.onClick) props.onClick(e);
    hashFragment = props.to
      .split('#')
      .slice(1)
      .join('#');
    if (hashFragment !== '') {
      scrollFunction =
        props.scroll ||
        (el =>
          props.smooth
            ? el.scrollIntoView({ behavior: "smooth" })
            : el.scrollIntoView());
      hashLinkScroll();
    }
  }
  return handleClick;
};

const propTypes = {
  onClick: PropTypes.func,
  children: PropTypes.any,
  scroll: PropTypes.func,
  to: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
};

HashLink.propTypes = propTypes;
