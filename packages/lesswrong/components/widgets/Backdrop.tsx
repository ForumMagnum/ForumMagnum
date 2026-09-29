import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import classNames from 'classnames';
import { createPortal } from 'react-dom';

const styles = defineStyles("Backdrop", (theme: ThemeType) => ({
  root: {
    zIndex: theme.zIndexes.backdrop,
    position: 'fixed',
    right: 0,
    bottom: 0,
    top: 0,
    left: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    opacity: 0.0,
    transition: 'opacity 0.3s ease-in-out',
    pointerEvents: "none",
  },
  visible: {
    opacity: 1.0,
    pointerEvents: "inherit",
  },
  blur: {
    backdropFilter: "blur(4px)",
  },
}), {
  // in dark mode, the darkening is still darkening, not flipped to lightening
  allowNonThemeColors: true,
})

/**
 * Full-viewport darkening/blur overlay for modals. The opacity fades in when
 * mounted with `visible`, and fades out when `visible` becomes false; the
 * parent is responsible for keeping it mounted for the duration of the
 * fade-out. `fadeDurationMs` overrides the default 300ms fade.
 */
export const Backdrop = ({visible, style="darken", fadeDurationMs}: {
  visible: boolean
  style?: "darken"|"blur"
  fadeDurationMs?: number
}) => {
  const classes = useStyles(styles);
  const nodeRef = useRef<HTMLDivElement|null>(null);
  // `ready` gates mounting the portal; `fadedIn` is set one commit later so
  // the element is first painted at opacity 0 and then transitions to visible.
  const [ready,setReady] = useState(false);
  const [fadedIn,setFadedIn] = useState(false);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setReady(true);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  useLayoutEffect(() => {
    if (!ready || !nodeRef.current) return;
    // Force a style computation while the backdrop is still at opacity 0, so
    // that adding the visible class starts the CSS transition instead of the
    // element appearing at full opacity.
    forceStyleRecalc(nodeRef.current);
    setFadedIn(true);
  }, [ready]);
  
  if (!ready) {
    return null;
  }
  
  return <>{createPortal(
    <div
      ref={nodeRef}
      className={classNames(classes.root, {
        [classes.visible]: visible && fadedIn,
        [classes.blur]: style==="blur" && fadedIn,
      })}
      style={fadeDurationMs !== undefined ? {transitionDuration: `${fadeDurationMs}ms`} : undefined}
    />, document.body
  )}</>;
}

function forceStyleRecalc(element: HTMLElement) {
  element.getBoundingClientRect();
}
