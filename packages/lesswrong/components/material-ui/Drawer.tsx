import React, { useEffect, useRef } from 'react';
import classNames from 'classnames';
import Modal from '@/lib/vendor/@material-ui/core/src/Modal';
import Slide from '@/lib/vendor/@material-ui/core/src/Slide';
import Paper from '@/lib/vendor/@material-ui/core/src/Paper';
import { duration } from '@/lib/vendor/@material-ui/core/src/styles/transitions';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';

const oppositeDirection = {
  left: 'right',
  right: 'left',
  top: 'down',
  bottom: 'up',
} as const;

const styles = defineStyles("Drawer", theme => ({
  /* Styles applied to the root element if `variant="permanent or persistent"`. */
  docked: {
    flex: '0 0 auto',
  },
  /* Styles applied to the `Paper` component. */
  paper: {
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    flex: '1 0 auto',
    zIndex: theme.zIndexes.drawer,
    WebkitOverflowScrolling: 'touch', // Add iOS momentum scrolling.
    // temporary style
    position: 'fixed',
    top: 0,
    // We disable the focus ring for mouse, touch and keyboard users.
    // At some point, it would be better to keep it for keyboard users.
    // :focus-ring CSS pseudo-class will help.
    outline: 'none',
  },
  /* Styles applied to the `Paper` component if `anchor="left"`. */
  paperAnchorLeft: {
    left: 0,
    right: 'auto',
  },
  /* Styles applied to the `Paper` component if `anchor="right"`. */
  paperAnchorRight: {
    left: 'auto',
    right: 0,
  },
  /* Styles applied to the `Paper` component if `anchor="top"`. */
  paperAnchorTop: {
    top: 0,
    left: 0,
    bottom: 'auto',
    right: 0,
    height: 'auto',
    maxHeight: '100%',
  },
  /* Styles applied to the `Paper` component if `anchor="bottom"`. */
  paperAnchorBottom: {
    top: 'auto',
    left: 0,
    bottom: 0,
    right: 0,
    height: 'auto',
    maxHeight: '100%',
  },
  /* Styles applied to the `Paper` component if `anchor="left"` & `variant` is not "temporary". */
  paperAnchorDockedLeft: {
    borderRight: `1px solid ${theme.palette.greyAlpha(0.12)}`,
  },
  /* Styles applied to the `Paper` component if `anchor="top"` & `variant` is not "temporary". */
  paperAnchorDockedTop: {
    borderBottom: `1px solid ${theme.palette.greyAlpha(0.12)}`,
  },
  /* Styles applied to the `Paper` component if `anchor="right"` & `variant` is not "temporary". */
  paperAnchorDockedRight: {
    borderLeft: `1px solid ${theme.palette.greyAlpha(0.12)}`,
  },
  /* Styles applied to the `Paper` component if `anchor="bottom"` & `variant` is not "temporary". */
  paperAnchorDockedBottom: {
    borderTop: `1px solid ${theme.palette.greyAlpha(0.12)}`,
  },
  /* Styles applied to the `Modal` component. */
  modal: {},
}));

const anchorToClassName = {
  left: "paperAnchorLeft",
  top: "paperAnchorTop",
  right: "paperAnchorRight",
  bottom: "paperAnchorBottom",
} as const;


const dockedAnchorToClassName = {
  left: "paperAnchorDockedLeft",
  top: "paperAnchorDockedTop",
  right: "paperAnchorDockedRight",
  bottom: "paperAnchorDockedBottom",
} as const;

interface DrawerProps {
  className?: string
  paperClassName?: string
  onClose: (event: any) => void
  anchor?: 'left' | 'top' | 'right' | 'bottom';
  children?: React.ReactNode;
  elevation?: number;
  open?: boolean;
  variant?: 'permanent' | 'persistent' | 'temporary';
}

/**
 * Drawer, based on material-UI's version of the component, somewhat cleaned
 * up and trimmed down.
 */
export function Drawer(props: DrawerProps) {
  const classes = useStyles(styles);

  // Let's assume that the Drawer will always be rendered on user space.
  // We use this state is order to skip the appear transition during the
  // initial mount of the component.
  const mounted = useRef(false);
  
  useEffect(() => {
    mounted.current = true;
  });

  const {
    anchor = "left",
    children,
    className,
    paperClassName,
    elevation = 16,
    onClose,
    open = false,
    variant='temporary',
    ...other
  } = props;
  const transitionDuration={enter: duration.enteringScreen, exit: duration.leavingScreen};

  const drawer = (
    <Paper
      elevation={variant === 'temporary' ? elevation : 0}
      square
      className={classNames(classes.paper, paperClassName,
      classes[anchorToClassName[anchor]],
      {
        [classes[dockedAnchorToClassName[anchor]]]: variant !== 'temporary',
      })}
    >
      {children}
    </Paper>
  );

  if (variant === 'permanent') {
    return (
      <div className={classNames(classes.docked, className)} {...other}>
        {drawer}
      </div>
    );
  }

  const slidingDrawer = (
    <Slide
      in={open}
      direction={oppositeDirection[anchor]}
      timeout={transitionDuration}
      appear={mounted.current}
    >
      {drawer}
    </Slide>
  );

  if (variant === 'persistent') {
    return (
      <div className={classNames(classes.docked, className)} {...other}>
        {slidingDrawer}
      </div>
    );
  }

  // variant === temporary
  return (
    <Modal
      BackdropProps={{
        transitionDuration,
      }}
      className={classNames(classes.modal, className)}
      open={open}
      onClose={onClose}
      {...other}
    >
      {slidingDrawer}
    </Modal>
  );
}
