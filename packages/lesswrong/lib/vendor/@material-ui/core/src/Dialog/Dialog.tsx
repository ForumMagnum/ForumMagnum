// @inheritedComponent Modal

import React from 'react';
import classNames from 'classnames';
import { capitalize } from '../utils/helpers';
import Modal from '../Modal';
import Fade from '../Fade';
import { duration } from '../styles/transitions';
import Paper from '../Paper';
import type { StandardProps } from '..';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import { ModalProps } from '../Modal/Modal';
import { TransitionHandlerProps, TransitionProps } from '../transitions/transition';
import { PaperProps } from '../Paper/Paper';

export interface DialogProps
  extends StandardProps<ModalProps & Partial<TransitionHandlerProps>, DialogClassKey, 'children'> {
  children?: React.ReactNode;
  fullScreen?: boolean;
  fullWidth?: boolean;
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | false;
  PaperProps?: Partial<PaperProps>;
  scroll?: 'body' | 'paper';
  TransitionComponent?: React.ComponentType;
  transitionDuration?: TransitionProps['timeout'];
  TransitionProps?: TransitionProps;
}

export type DialogClassKey =
  | 'root'
  | 'scrollPaper'
  | 'scrollBody'
  | 'paper'
  | 'paperScrollPaper'
  | 'paperScrollBody'
  | 'paperWidthXs'
  | 'paperWidthSm'
  | 'paperWidthMd'
  | 'paperFullWidth'
  | 'paperFullScreen';

export const styles = defineStyles("MuiDialog", theme => ({
  /* Styles applied to the root element. */
  root: {},
  /* Styles applied to the root element if `scroll="paper"`. */
  scrollPaper: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  /* Styles applied to the root element if `scroll="bodyr"`. */
  scrollBody: {
    overflowY: 'auto',
    overflowX: 'hidden',
  },
  /* Styles applied to the `Paper` component. */
  paper: {
    display: 'flex',
    flexDirection: 'column',
    margin: 48,
    position: 'relative',
    overflowY: 'auto', // Fix IE11 issue, to remove at some point.
    // We disable the focus ring for mouse, touch and keyboard users.
    outline: 'none',
  },
  /* Styles applied to the `Paper` component if `scroll="paper"`. */
  paperScrollPaper: {
    flex: '0 1 auto',
    maxHeight: 'calc(100% - 96px)',
  },
  /* Styles applied to the `Paper` component if `scroll="body"`. */
  paperScrollBody: {
    margin: '48px auto',
  },
  /* Styles applied to the `Paper` component if `maxWidth="xs"`. */
  paperWidthXs: {
    maxWidth: Math.max(theme.breakpoints.values.xs, 360),
    '&$paperScrollBody': {
      [theme.breakpoints.down(Math.max(theme.breakpoints.values.xs, 360) + 48 * 2)]: {
        margin: 48,
      },
    },
  },
  /* Styles applied to the `Paper` component if `maxWidth="sm"`. */
  paperWidthSm: {
    maxWidth: theme.breakpoints.values.sm,
    '&$paperScrollBody': {
      [theme.breakpoints.down(theme.breakpoints.values.sm + 48 * 2)]: {
        margin: 48,
      },
    },
  },
  /* Styles applied to the `Paper` component if `maxWidth="md"`. */
  paperWidthMd: {
    maxWidth: theme.breakpoints.values.md,
    '&$paperScrollBody': {
      [theme.breakpoints.down(theme.breakpoints.values.md + 48 * 2)]: {
        margin: 48,
      },
    },
  },
  /* Styles applied to the `Paper` component if `maxWidth="lg"`. */
  paperWidthLg: {
    maxWidth: theme.breakpoints.values.lg,
    '&$paperScrollBody': {
      [theme.breakpoints.down(theme.breakpoints.values.lg + 48 * 2)]: {
        margin: 48,
      },
    },
  },
  /* Styles applied to the `Paper` component if `fullWidth={true}`. */
  paperFullWidth: {
    width: '100%',
  },
  /* Styles applied to the `Paper` component if `fullScreen={true}`. */
  paperFullScreen: {
    margin: 0,
    width: '100%',
    maxWidth: '100%',
    height: '100%',
    maxHeight: 'none',
    borderRadius: 0,
    '&$paperScrollBody': {
      margin: 0,
    },
  },
}), {stylePriority: -10});

/**
 * Dialogs are overlaid modal paper based components with a backdrop.
 */
function Dialog(props: DialogProps) {
  const {
    BackdropProps,
    children,
    classes: classesOverride,
    className,
    disableBackdropClick,
    disableEscapeKeyDown,
    fullScreen,
    fullWidth,
    maxWidth,
    onBackdropClick,
    onClose,
    onEnter,
    onEntered,
    onEntering,
    onEscapeKeyDown,
    onExit,
    onExited,
    onExiting,
    open,
    PaperProps,
    scroll,
    TransitionComponent,
    transitionDuration,
    TransitionProps,
    ...other
  } = props;
  const classes = useStyles(styles, classesOverride);

  return (
    <Modal
      className={classNames(classes.root, classes[`scroll${capitalize(scroll)}`], className)}
      BackdropProps={{
        transitionDuration,
        ...BackdropProps,
      }}
      disableBackdropClick={disableBackdropClick}
      disableEscapeKeyDown={disableEscapeKeyDown}
      onBackdropClick={onBackdropClick}
      onEscapeKeyDown={onEscapeKeyDown}
      onClose={onClose}
      open={open}
      role="dialog"
      {...other}
    >
      <TransitionComponent
        appear
        in={open}
        timeout={transitionDuration}
        onEnter={onEnter}
        onEntering={onEntering}
        onEntered={onEntered}
        onExit={onExit}
        onExiting={onExiting}
        onExited={onExited}
        {...TransitionProps}
      >
        <Paper
          elevation={24}
          className={classNames(classes.paper, classes[`paperScroll${capitalize(scroll)}`], {
            [classes[`paperWidth${maxWidth ? capitalize(maxWidth) : ''}`]]: maxWidth,
            [classes.paperFullScreen]: fullScreen,
            [classes.paperFullWidth]: fullWidth,
          })}
          {...PaperProps}
        >
          {children}
        </Paper>
      </TransitionComponent>
    </Modal>
  );
}

Dialog.defaultProps = {
  disableBackdropClick: false,
  disableEscapeKeyDown: false,
  fullScreen: false,
  fullWidth: false,
  maxWidth: 'sm',
  scroll: 'paper',
  TransitionComponent: Fade,
  transitionDuration: { enter: duration.enteringScreen, exit: duration.leavingScreen },
};

export default Dialog;
