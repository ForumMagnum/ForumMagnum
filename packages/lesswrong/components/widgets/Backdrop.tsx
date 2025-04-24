import React, { useEffect, useState } from 'react';
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
  },
  blur: {
    backdropFilter: "blur(4px)",
  },
}))

export const Backdrop = ({visible, style="darken"}: {
  visible: boolean
  style?: "darken"|"blur"
}) => {
  const classes = useStyles(styles);
  const [ready,setReady] = useState(false);
  
  useEffect(() => {
    setTimeout(() => {
      setReady(true);
    }, 0);
  }, []);
  
  return <>{createPortal(
    <div className={classNames(classes.root, {
      [classes.visible]: visible && ready,
      [classes.blur]: style==="blur" && ready,
    })}/>, document.body
  )}</>;
}
