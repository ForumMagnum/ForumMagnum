import React, { useEffect, useRef, useState } from 'react';
import classNames from 'classnames';
import Paper from '@/lib/vendor/@material-ui/core/src/Paper';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import { Backdrop } from '../widgets/Backdrop';
import ClickAwayListener from '@/lib/vendor/react-click-away-listener';
import { createPortal } from 'react-dom';

const styles = defineStyles("Drawer", theme => ({
  containerLeft: {
    position: "absolute",
    top: 0,
    left: 0,
    bottom: 0,
    width: 0,
  },
  containerRight: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    width: 0,
  },
  docked: {
    flex: '0 0 auto',
  },
  paper: {
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    flex: '1 0 auto',
    zIndex: theme.zIndexes.drawer,
    WebkitOverflowScrolling: 'touch', // Add iOS momentum scrolling.
    position: 'fixed',
    top: 0,
    outline: 'none',
    transition: "margin-left 0.35s ease-out",
  },
  anchorLeft: {
    left: 0,
    right: 'auto',
    marginLeft: -280,
  },
  anchorRight: {
    left: 'auto',
    right: 0,
    marginRight: "-100%",
  },
  open: {
    marginLeft: "0 !important",
    marginRight: "0 !important",
  },
  closed: {
  },
  paperAnchorDockedLeft: {
    borderRight: `1px solid ${theme.palette.greyAlpha(0.12)}`,
  },
  paperAnchorDockedRight: {
    borderLeft: `1px solid ${theme.palette.greyAlpha(0.12)}`,
  },
}));

/**
 * A side drawer. Vaguely inspired by material-UI's Drawer component, but with
 * almost no code in common.
 */
export function Drawer({className, paperClassName, onClose, anchor="left", open, variant="temporary", children}: {
  className?: string
  paperClassName?: string
  onClose: (event: any) => void
  anchor?: 'left'|'right';
  open: boolean;
  variant?: 'persistent' | 'temporary';
  children?: React.ReactNode;
}) {
  const classes = useStyles(styles);
  const [mounted, setMounted] = useState(false);
  const [slidIn, setSlidIn] = useState(false);
  const clickAwayListenerActive = useRef(0);
  
  useEffect(() => {
    if (open) {
      if (mounted) {
        setSlidIn(true);
      } else {
        setMounted(true);
      }
      setTimeout(() => {
        clickAwayListenerActive.current++;
      }, 100);
      return () => {
        // eslint-disable-next-line react-hooks/exhaustive-deps
        clickAwayListenerActive.current--;
      }
    } else {
      setSlidIn(false);
    }
  }, [open, mounted]);

  const drawer = (
    <Paper
      elevation={variant === 'temporary' ? 16 : 0}
      square
      className={classNames(
        classes.paper,
        paperClassName, {
          [classes.anchorLeft]: anchor==="left",
          [classes.anchorRight]: anchor==="right",
          [classes.open]: slidIn,
          [classes.closed]: !slidIn,
        }
      )}
    >
      {children}
    </Paper>
  );

  if (variant === 'persistent') {
    return (
      <div className={classNames(classes.docked, className)}>
        {drawer}
      </div>
    );
  }

  // variant === temporary
  return <>
    {mounted && <Backdrop visible={slidIn}/>}
    {mounted && createPortal(
      <div className={classNames(className, {
        [classes.containerLeft]: anchor==='left',
        [classes.containerRight]: anchor==='right',
      })}>
        <ClickAwayListener onClickAway={(ev) => {
          if (clickAwayListenerActive.current > 0) {
            onClose?.(ev)
          }
        }}>
          <span>{drawer}</span>
        </ClickAwayListener>
      </div>,
      document.body
    )}
  </>;
}
