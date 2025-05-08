import React, { useEffect, useRef, useState } from 'react';
import classNames from 'classnames';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import { Backdrop } from '../widgets/Backdrop';
import ClickAwayListener from '@/lib/vendor/react-click-away-listener';
import { createPortal } from 'react-dom';
import { Paper } from '../widgets/Paper';

const closeAnimDurationMs = 300;

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
  container: {
    zIndex: theme.zIndexes.drawer,
    position: 'fixed',
    top: 0,
  },
  paper: {
    position: "absolute",
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    flex: '1 0 auto',
    WebkitOverflowScrolling: 'touch', // Add iOS momentum scrolling.
    outline: 'none',
    //transition: "margin-left 0.35s ease-out",
    transition: `transform ${closeAnimDurationMs / 1000}s ease-out`,
  },
  anchorLeft: {
    right: "100%",
    transform: "translateX(0)",
    //left: 0,
    //right: 'auto',
    //marginLeft: -280,
  },
  anchorRight: {
    //left: 'auto',
    //right: 0,
    //marginRight: "-100%",
    left: "100%",
    transform: "translateX(0)",
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
  const paperRef = useRef<HTMLDivElement|null>(null);
  const clickAwayListenerActive = useRef(0);
  const unmountTimer = useRef<ReturnType<typeof setTimeout>|null>(null);
  
  useEffect(() => {
    if (open) {
      if (mounted) {
        setTimeout(() => {
          setSlidIn(true);
        }, 0);
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
      
      // Unmount after the animation finishes, to prevent a drop-shadow
      // from the drawer overhanging into the visible part of the screen
      if (unmountTimer.current) {
        clearTimeout(unmountTimer.current);
      }
      unmountTimer.current = setTimeout(() => {
        setMounted(false);
      }, closeAnimDurationMs)
    }
    
    return () => {
      if (unmountTimer.current) {
        clearTimeout(unmountTimer.current);
      }
    };
  }, [open, mounted]);

  const paperWidth = paperRef.current?.clientWidth ?? 280;

  const drawer = (
    <Paper
      elevation={variant === 'temporary' ? 16 : 0}
      square
      nodeRef={paperRef}
      className={classNames(
        classes.paper,
        paperClassName, {
          [classes.anchorLeft]: anchor==="left",
          [classes.anchorRight]: anchor==="right",
          [classes.open]: slidIn,
          [classes.closed]: !slidIn,
        }
      )}
      style={slidIn ? {
        transform: `translateX(${anchor==="left" ? paperWidth : -paperWidth}px)`
      } : {}}
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
      <div
        className={classNames(classes.container, className, {
          [classes.containerLeft]: anchor==='left',
          [classes.containerRight]: anchor==='right',
        })}
      >
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
