import React, { ReactNode } from 'react';
import { useHover } from './withHover';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import classNames from 'classnames';

const HANDLE_SIZE = 9; // Should be an odd number
const ARROW_SIZE = 8;

const styles = (theme: ThemeType) => ({
  container: {
    display: 'inline-block',
    position: 'relative',
  },
  tooltip: {
    background: theme.palette.lwTertiary.main,
  },
  'tooltip-left': {
    marginRight: ARROW_SIZE,
  },
  'tooltip-right': {
    marginLeft: ARROW_SIZE,
  },
  'tooltip-top': {
    marginBottom: ARROW_SIZE,
  },
  'tooltip-bottom': {
    marginTop: ARROW_SIZE,
  },
  content: {
    maxWidth: 250,
    '@media (max-width: 800px)': {
      maxWidth: 180,
    },
  },
  handle: {
    cursor: 'pointer',
    position: 'absolute',
    width: HANDLE_SIZE,
    height: HANDLE_SIZE,
    borderRadius: '50%',
    margin: `${-Math.floor(HANDLE_SIZE / 2)}px 0 0 ${-Math.floor(HANDLE_SIZE / 2)}px`,
    background: theme.palette.lwTertiary.main,
    '@media (max-width: 450px), (hover: none)': {
      display: 'none',
    },
  },
  'handle-left': {
    left: 0,
    top: '50%',
  },
  'handle-right': {
    right: -Math.floor(HANDLE_SIZE / 2),
    top: '50%',
  },
  'handle-top': {
    left: '50%',
    top: 0,
  },
  'handle-bottom': {
    left: '50%',
    bottom: -Math.floor(HANDLE_SIZE / 2),
  },
  arrow: {
    background: theme.palette.lwTertiary.main,
    position: 'absolute',
    '&:after': {
      content: '""',
      position: 'absolute',
      border: `${ARROW_SIZE}px solid transparent`,
    },
  },
  'arrow-left': {
    right: 0,
    top: '50%',
    '&:after': {
      marginTop: -ARROW_SIZE,
      borderLeftColor: theme.palette.lwTertiary.main,
    },
  },
  'arrow-right': {
    left: -2 * ARROW_SIZE,
    top: '50%',
    '&:after': {
      marginTop: -ARROW_SIZE,
      borderRightColor: theme.palette.lwTertiary.main,
    },
  },
  'arrow-top': {
    bottom: 0,
    left: '50%',
    '&:after': {
      marginLeft: -ARROW_SIZE,
      borderTopColor: theme.palette.lwTertiary.main,
    },
  },
  'arrow-bottom': {
    top: -2 * ARROW_SIZE,
    left: '50%',
    '&:after': {
      marginLeft: -ARROW_SIZE,
      borderBottomColor: theme.palette.lwTertiary.main,
    },
  },
});

const NewFeatureTooltip = ({classes, children, title = 'New feature!', placement = 'left'}: {
  children?: ReactNode,
  title?: string,
  placement?: 'top'|'right'|'left'|'bottom',
  classes: ClassesType<typeof styles>,
}) => {
  const { hover, everHovered, anchorEl, eventHandlers } = useHover({
    eventProps: {
      pageElementContext: 'newFeatureHovered',
      title,
    },
  });

  const { LWPopper } = Components;

  return (
    <span className={classes.container}>
      {everHovered &&
        <LWPopper
          placement={placement}
          open={hover}
          anchorEl={anchorEl}
          tooltip
          allowOverflow={false}
          clickable={false}
          className={classNames(classes.tooltip, classes[`tooltip-${placement}`])}
        >
          <div className={classes.content}>{title}</div>
          <div className={classNames(classes.arrow, classes[`arrow-${placement}`])} />
        </LWPopper>
      }
      {children}
      <div
        className={classNames(classes.handle, classes[`handle-${placement}`])}
        {...eventHandlers}
      />
    </span>
  );
}

const NewFeatureTooltipComponent = registerComponent('NewFeatureTooltip', NewFeatureTooltip, { styles });

declare global {
  interface ComponentTypes {
    NewFeatureTooltip: typeof NewFeatureTooltipComponent
  }
}
