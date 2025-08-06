import React, { useEffect, useRef, useState } from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import classNames from 'classnames';
import { defineStyles, useStyles } from '../hooks/useStyles';
import { Paper } from '../widgets/Paper';
import { Backdrop } from '../widgets/Backdrop';
import { createPortal } from 'react-dom';
import ClickAwayListener from '@/lib/vendor/react-click-away-listener';
import { useGlobalKeydown } from './withGlobalKeydown';

const styles = defineStyles("LWDialog", theme => ({
  dialogWrapper: {
    position: "fixed",
    zIndex: theme.zIndexes.modal,
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    pointerEvents: "none", // to prevent interfering with clickaway
  },
  paper: {
    position: "relative",
    display: "flex",
    flex: '0 1 auto',
    maxHeight: 'calc(100% - 96px)',
    flexDirection: 'column',
    margin: '48px auto',
    pointerEvents: "auto",
  },
  paperFullScreen: {
    margin: 0,
    width: '100%',
    maxWidth: '100%',
    height: '100%',
    maxHeight: 'none',
    borderRadius: 0,
  },
  paperFullWidth: {
    width: '100%',
  },
  /* Styles applied to the `Paper` component if `maxWidth="sm"`. */
  paperWidthSm: {
    maxWidth: theme.breakpoints.values.sm,
  },
  /* Styles applied to the `Paper` component if `maxWidth="md"`. */
  paperWidthMd: {
    maxWidth: theme.breakpoints.values.md,
  },
  hidden: {
    display: "none !important",
  },
}), {stylePriority: -1});

// Wrapped to ensure the disableEnforceFocus prop is provided, since not
// providing that breaks the toolbar in CkEditor and DraftJS. Also provides a
// centralized place to fix it if we discover other issues with MUI Dialog, or
// want to write it ourselves.
const LWDialog = ({open, fullScreen, title, maxWidth='sm', fullWidth, disableBackdropClick, disableEscapeKeyDown, className, paperClassName, onClose, keepMounted, backdrop="darken", children}: {
  open: boolean,
  fullScreen?: boolean,
  title?: string,
  maxWidth?: false|'sm'|'md',
  fullWidth?: boolean,
  disableBackdropClick?: boolean,
  disableEscapeKeyDown?: boolean,
  className?: string,
  paperClassName?: string,
  onClose?: () => void,
  keepMounted?: boolean,
  backdrop?: "none"|"darken"|"blur",
  children: React.ReactNode,
}) => {
  const classes = useStyles(styles);
  const [everOpened, setEverOpened] = useState(false);
  const openRecently = useDelayedHide(open, 0.5);

  useEffect(() => {
    if (open) {
      setEverOpened(true);
    }
  }, [open]);
  
  useGlobalKeydown(ev => {
    if (ev.key === 'Escape' && !disableEscapeKeyDown) {
      onClose?.();
    }
  });
  
  return <>
    {backdrop!=="none" && openRecently && <Backdrop visible={open} style={backdrop}/>}
    {everOpened && (open || keepMounted) && createPortal(
      <div>
        <ClickAwayListener onClickAway={() => {
            if (!open || disableBackdropClick) return;
            onClose?.();
          }}>
          <div className={classNames(
            classes.dialogWrapper, className, {
              [classes.hidden]: !open,
            }
          )}>
            <Paper
              elevation={24}
              className={classNames(classes.paper, paperClassName, {
                [classes.paperWidthSm]: maxWidth==='sm',
                [classes.paperWidthMd]: maxWidth==='md',
                [classes.paperFullScreen]: fullScreen,
                [classes.paperFullWidth]: fullWidth,
              })}
            >
              {children}
            </Paper>
          </div>
        </ClickAwayListener>
      </div>,
      document.body
    )}
  </>;
}

/**
 * Given an `open` flag, returns whether the flag is either currently set or
 * was set at any time within the past `delay` seconds, using React effect
 * hooks to manage timers.
 */
function useDelayedHide(open: boolean, delay: number): boolean {
  const [delayedHide, setDelayedHide] = useState(open);
  const timerRef = useRef<ReturnType<typeof setTimeout>|null>(null);

  useEffect(() => {
    // If open is true, immediately show
    if (open) {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      setDelayedHide(true);
    } else {
      // When closing, set a timer to hide after delay
      timerRef.current = setTimeout(() => {
        setDelayedHide(false);
        timerRef.current = null;
      }, delay * 1000);
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [open, delay]);

  return delayedHide;
}

export default registerComponent('LWDialog', LWDialog);


