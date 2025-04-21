import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import warning from 'warning';
import withStyles from '../styles/withStyles';
import { lighten } from '../styles/colorManipulator';

const TRANSITION_DURATION = 4; // seconds

export const styles = theme => ({
  /* Styles applied to the root element. */
  root: {
    position: 'relative',
    overflow: 'hidden',
    height: 5,
  },
  /* Styles applied to the root & bar2 element if `color="primary"`; bar2 if `variant-"buffer"`. */
  colorPrimary: {
    backgroundColor: lighten(theme.palette.primary.light, 0.6),
  },
  // eslint-disable-next-line max-len
  /* Styles applied to the root & bar2 elements if `color="secondary"`; bar2 if `variant="buffer"`. */
  colorSecondary: {
    backgroundColor: lighten(theme.palette.secondary.light, 0.4),
  },
  /* Styles applied to the root element if `variant="buffer"`. */
  buffer: {
    backgroundColor: 'transparent',
  },
  /* Styles applied to the root element if `variant="query"`. */
  query: {
    transform: 'rotate(180deg)',
  },
  /* Styles applied to the additional bar element if `variant="buffer"`. */
  dashed: {
    position: 'absolute',
    marginTop: 0,
    height: '100%',
    width: '100%',
    animation: 'buffer 3s infinite linear',
  },
  /* Styles applied to the additional bar element if `variant="buffer"` & `color="primary"`. */
  dashedColorPrimary: {
    backgroundImage: `radial-gradient(${lighten(theme.palette.primary.light, 0.6)} 0%, ${lighten(
      theme.palette.primary.light,
      0.6,
    )} 16%, transparent 42%)`,
    backgroundSize: '10px 10px',
    backgroundPosition: '0px -23px',
  },
  /* Styles applied to the additional bar element if `variant="buffer"` & `color="secondary"`. */
  dashedColorSecondary: {
    backgroundImage: `radial-gradient(${lighten(theme.palette.secondary.light, 0.4)} 0%, ${lighten(
      theme.palette.secondary.light,
      0.6,
    )} 16%, transparent 42%)`,
    backgroundSize: '10px 10px',
    backgroundPosition: '0px -23px',
  },
  /* Styles applied to the layered bar1 & bar2 elements. */
  bar: {
    width: '100%',
    position: 'absolute',
    left: 0,
    bottom: 0,
    top: 0,
    transition: 'transform 0.2s linear',
    transformOrigin: 'left',
  },
  /* Styles applied to the bar elements if `color="primary"`; bar2 if `variant` not "buffer". */
  barColorPrimary: {
    backgroundColor: theme.palette.primary.main,
  },
  /* Styles applied to the bar elements if `color="secondary"`; bar2 if `variant` not "buffer". */
  barColorSecondary: {
    backgroundColor: theme.palette.secondary.main,
  },
  /* Styles applied to the bar1 element if `variant="indeterminate or query"`. */
  bar1Indeterminate: {
    width: 'auto',
    willChange: 'left, right',
    animation: 'mui-indeterminate1 2.1s cubic-bezier(0.65, 0.815, 0.735, 0.395) infinite',
  },
  /* Styles applied to the bar1 element if `variant="determinate"`. */
  bar1Determinate: {
    willChange: 'transform',
    transition: `transform .${TRANSITION_DURATION}s linear`,
  },
  /* Styles applied to the bar1 element if `variant="buffer"`. */
  bar1Buffer: {
    zIndex: 1,
    transition: `transform .${TRANSITION_DURATION}s linear`,
  },
  /* Styles applied to the bar2 element if `variant="indeterminate or query"`. */
  bar2Indeterminate: {
    width: 'auto',
    willChange: 'left, right',
    animation: 'mui-indeterminate2 2.1s cubic-bezier(0.165, 0.84, 0.44, 1) infinite',
    animationDelay: '1.15s',
  },
  /* Styles applied to the bar2 element if `variant="determinate"`. */
  bar2Determinate: {},
  /* Styles applied to the bar2 element if `variant="buffer"`. */
  bar2Buffer: {
    transition: `transform .${TRANSITION_DURATION}s linear`,
  },
  // Legends:
  // || represents the viewport
  // -  represents a light background
  // x  represents a dark background
  '@keyframes mui-indeterminate1': {
    //  |-----|---x-||-----||-----|
    '0%': {
      left: '-35%',
      right: '100%',
    },
    //  |-----|-----||-----||xxxx-|
    '60%': {
      left: '100%',
      right: '-90%',
    },
    '100%': {
      left: '100%',
      right: '-90%',
    },
  },
  '@keyframes mui-indeterminate2': {
    //  |xxxxx|xxxxx||-----||-----|
    '0%': {
      left: '-200%',
      right: '100%',
    },
    //  |-----|-----||-----||-x----|
    '60%': {
      left: '107%',
      right: '-8%',
    },
    '100%': {
      left: '107%',
      right: '-8%',
    },
  },
  '@keyframes buffer': {
    '0%': {
      opacity: 1,
      backgroundPosition: '0px -23px',
    },
    '50%': {
      opacity: 0,
      backgroundPosition: '0px -23px',
    },
    '100%': {
      opacity: 1,
      backgroundPosition: '-200px -23px',
    },
  },
});

/**
 * ## ARIA
 *
 * If the progress bar is describing the loading progress of a particular region of a page,
 * you should use `aria-describedby` to point to the progress bar, and set the `aria-busy`
 * attribute to `true` on that region until it has finished loading.
 */
function LinearProgress(props) {
  const { classes, className: classNameProp, color, value, valueBuffer, variant, ...other } = props;

  const className = classNames(
    classes.root,
    {
      [classes.colorPrimary]: color === 'primary',
      [classes.colorSecondary]: color === 'secondary',
      [classes.buffer]: variant === 'buffer',
      [classes.query]: variant === 'query',
    },
    classNameProp,
  );
  const dashedClass = classNames(classes.dashed, {
    [classes.dashedColorPrimary]: color === 'primary',
    [classes.dashedColorSecondary]: color === 'secondary',
  });
  const bar1ClassName = classNames(classes.bar, {
    [classes.barColorPrimary]: color === 'primary',
    [classes.barColorSecondary]: color === 'secondary',
    [classes.bar1Indeterminate]: variant === 'indeterminate' || variant === 'query',
    [classes.bar1Determinate]: variant === 'determinate',
    [classes.bar1Buffer]: variant === 'buffer',
  });
  const bar2ClassName = classNames(classes.bar, {
    [classes.barColorPrimary]: color === 'primary' && variant !== 'buffer',
    [classes.colorPrimary]: color === 'primary' && variant === 'buffer',
    [classes.barColorSecondary]: color === 'secondary' && variant !== 'buffer',
    [classes.colorSecondary]: color === 'secondary' && variant === 'buffer',
    [classes.bar2Indeterminate]: variant === 'indeterminate' || variant === 'query',
    [classes.bar2Determinate]: variant === 'determinate',
    [classes.bar2Buffer]: variant === 'buffer',
  });
  const rootProps = {};
  const inlineStyles = { bar1: {}, bar2: {} };

  if (variant === 'determinate' || variant === 'buffer') {
    if (value !== undefined) {
      rootProps['aria-valuenow'] = Math.round(value);
      inlineStyles.bar1.transform = `scaleX(${value / 100})`;
    } else {
      warning(
        false,
        'Material-UI: you need to provide a value property ' +
          'when using the determinate or buffer variant of LinearProgress .',
      );
    }
  }
  if (variant === 'buffer') {
    if (valueBuffer !== undefined) {
      inlineStyles.bar2.transform = `scaleX(${(valueBuffer || 0) / 100})`;
    } else {
      warning(
        false,
        'Material-UI: you need to provide a valueBuffer property ' +
          'when using the buffer variant of LinearProgress.',
      );
    }
  }

  return (
    <div className={className} role="progressbar" {...rootProps} {...other}>
      {variant === 'buffer' ? <div className={dashedClass} /> : null}
      <div className={bar1ClassName} style={inlineStyles.bar1} />
      {variant === 'determinate' ? null : (
        <div className={bar2ClassName} style={inlineStyles.bar2} />
      )}
    </div>
  );
}

LinearProgress.propTypes = {
  /**
   * Override or extend the styles applied to the component.
   * See [CSS API](#css-api) below for more details.
   */
  classes: PropTypes.object.isRequired,
  /**
   * @ignore
   */
  className: PropTypes.string,
  /**
   * The color of the component. It supports those theme colors that make sense for this component.
   */
  color: PropTypes.oneOf(['primary', 'secondary']),
  /**
   * The value of the progress indicator for the determinate and buffer variants.
   * Value between 0 and 100.
   */
  value: PropTypes.number,
  /**
   * The value for the buffer variant.
   * Value between 0 and 100.
   */
  valueBuffer: PropTypes.number,
  /**
   * The variant to use.
   * Use indeterminate or query when there is no progress value.
   */
  variant: PropTypes.oneOf(['determinate', 'indeterminate', 'buffer', 'query']),
};

LinearProgress.defaultProps = {
  color: 'primary',
  variant: 'indeterminate',
};

export default withStyles(styles, { name: 'MuiLinearProgress' })(LinearProgress);
