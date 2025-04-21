import React from 'react';
import classNames from 'classnames';
import Fade from '../Fade';
import type { StandardProps } from '..';
import type { FadeProps } from '../Fade/Fade';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import type { TransitionProps } from '../transitions/transition';

export interface BackdropProps
  extends StandardProps<
      React.HTMLAttributes<HTMLDivElement> & Partial<FadeProps>,
      BackdropClassKey
    > {
  invisible?: boolean;
  onClick?: React.ReactEventHandler<{}>;
  open: boolean;
  transitionDuration?: TransitionProps['timeout'];
}

export type BackdropClassKey = 'root' | 'invisible';

export const styles = defineStyles("MuiBackdrop", theme => ({
  /* Styles applied to the root element. */
  root: {
    zIndex: -1,
    position: 'fixed',
    right: 0,
    bottom: 0,
    top: 0,
    left: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    // Remove grey highlight
    WebkitTapHighlightColor: 'transparent',
    // Disable scroll capabilities.
    touchAction: 'none',
  },
  /* Styles applied to the root element if `invisible={true}`. */
  invisible: {
    backgroundColor: 'transparent',
  },
}), {stylePriority: -10});

function Backdrop(props: BackdropProps) {
  const { classes: classesOverrides, className, invisible, open, transitionDuration, ...other } = props;
  const classes = useStyles(styles, classesOverrides);

  return (
    <Fade in={open} timeout={transitionDuration} {...other}>
      <div
        data-mui-test="Backdrop"
        className={classNames(
          classes.root,
          {
            [classes.invisible]: invisible,
          },
          className,
        )}
        aria-hidden="true"
      />
    </Fade>
  );
}

Backdrop.defaultProps = {
  invisible: false,
};

export default Backdrop;
