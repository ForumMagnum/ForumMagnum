import React from 'react';
import ReactDOM from 'react-dom';
import keycode from 'keycode';
import classNames from 'classnames';
import ButtonBase from '@/lib/vendor/@material-ui/core/src/ButtonBase';
import { fade } from '@/lib/vendor/@material-ui/core/src/styles/colorManipulator';
import clamp from '../utils/clamp';
import { StandardProps } from '..';
import { defineStyles, withStyles } from '@/components/hooks/useStyles';
import { withTheme } from '@/components/themes/useTheme';

export interface SliderProps
  extends StandardProps<React.HTMLAttributes<HTMLDivElement>, SliderClassKey, 'onChange'> {
  disabled?: boolean;
  vertical?: boolean;
  max?: number;
  min?: number;
  step?: number;
  value?: number;
  onChange?: (event: React.ChangeEvent<{}>, value: number) => void;
  onDragEnd?: (event: React.ChangeEvent<{}>) => void;
  onDragStart?: (event: React.ChangeEvent<{}>) => void;
  theme: ThemeType
}

export type SliderClassKey =
  | 'root'
  | 'container'
  | 'track'
  | 'trackBefore'
  | 'trackAfter'
  | 'thumb'
  | 'focused'
  | 'activated'
  | 'disabled'
  | 'vertical'
  | 'jumped';

export const styles = defineStyles("MuiSlider", theme => {
  const commonTransitionsOptions = {
    duration: theme.transitions.duration.shortest,
    easing: theme.transitions.easing.easeOut,
  };

  const commonTransitions = theme.transitions.create(
    ['width', 'height', 'left', 'right', 'top', 'box-shadow'],
    commonTransitionsOptions,
  );
  // no transition on the position
  const thumbActivatedTransitions = theme.transitions.create(
    ['width', 'height', 'box-shadow'],
    commonTransitionsOptions,
  );

  const colors = {
    primary: theme.palette.primary.main,
    disabled: theme.palette.grey[400],
  };

  return {
    /* Styles applied to the root element. */
    root: {
      position: 'relative',
      width: '100%',
      padding: '16px 8px',
      cursor: 'pointer',
      WebkitTapHighlightColor: 'transparent',
      '&$disabled': {
        cursor: 'no-drop',
      },
      '&$vertical': {
        height: '100%',
        padding: '8px 16px',
      },
    },
    /* Styles applied to the container element. */
    container: {
      position: 'relative',
      '&$vertical': {
        height: '100%',
      },
    },
    /* Styles applied to the track elements. */
    track: {
      position: 'absolute',
      transform: 'translate(0, -50%)',
      top: '50%',
      height: 2,
      backgroundColor: colors.primary,
      '&$activated': {
        transition: 'none',
      },
      '&$disabled': {
        backgroundColor: colors.disabled,
      },
      '&$vertical': {
        transform: 'translate(-50%, 0)',
        left: '50%',
        top: 'initial',
        width: 2,
      },
    },
    /* Styles applied to the track element before the thumb. */
    trackBefore: {
      zIndex: 1,
      left: 0,
      transition: commonTransitions,
    },
    /* Styles applied to the track element after the thumb. */
    trackAfter: {
      right: 0,
      opacity: 0.24,
      transition: commonTransitions,
      '&$vertical': {
        bottom: 0,
      },
    },
    /* Styles applied to the thumb element. */
    thumb: {
      position: 'absolute',
      zIndex: 2,
      transform: 'translate(-50%, -50%)',
      width: 12,
      height: 12,
      borderRadius: '50%',
      transition: commonTransitions,
      backgroundColor: colors.primary,
      '&$focused': {
        boxShadow: `0px 0px 0px 9px ${fade(colors.primary, 0.16)}`,
      },
      '&$activated': {
        width: 17,
        height: 17,
        transition: thumbActivatedTransitions,
      },
      '&$disabled': {
        cursor: 'no-drop',
        width: 9,
        height: 9,
        backgroundColor: colors.disabled,
      },
      '&$jumped': {
        width: 17,
        height: 17,
      },
    },
    /* Class applied to the thumb element if custom thumb icon provided. */
    thumbIconWrapper: {
      backgroundColor: 'transparent',
    },
    thumbIcon: {
      height: 'inherit',
      width: 'inherit',
    },
    /* Class applied to the track and thumb elements to trigger JSS nested styles if `disabled`. */
    disabled: {},
    /* Class applied to the track and thumb elements to trigger JSS nested styles if `jumped`. */
    jumped: {},
    /* Class applied to the track and thumb elements to trigger JSS nested styles if `focused`. */
    focused: {},
    /* Class applied to the track and thumb elements to trigger JSS nested styles if `activated`. */
    activated: {},
    /* Class applied to the root, track and container to trigger JSS nested styles if `vertical`. */
    vertical: {},
  };
}, {stylePriority: -10});

function percentToValue(percent: number, min: number, max: number) {
  return ((max - min) * percent) / 100 + min;
}

function roundToStep(number: number, step: number) {
  return Math.round(number / step) * step;
}

function getOffset(node: Element) {
  const { pageYOffset, pageXOffset } = global;
  const { left, top } = node.getBoundingClientRect();

  return {
    top: top + pageYOffset,
    left: left + pageXOffset,
  };
}

function getMousePosition(event: AnyBecauseTodo) {
  if (event.changedTouches && event.changedTouches[0]) {
    return {
      x: event.changedTouches[0].pageX,
      y: event.changedTouches[0].pageY,
    };
  }

  return {
    x: event.pageX,
    y: event.pageY,
  };
}

function calculatePercent(node: Element, event: AnyBecauseTodo, isVertical: boolean, isRtl: boolean) {
  const { width, height } = node.getBoundingClientRect();
  const { top, left } = getOffset(node);
  const { x, y } = getMousePosition(event);

  const value = isVertical ? y - top : x - left;
  const onePercent = (isVertical ? height : width) / 100;

  return isRtl && !isVertical ? 100 - clamp(value / onePercent) : clamp(value / onePercent);
}

function preventPageScrolling(event: AnyBecauseTodo) {
  event.preventDefault();
}

class Slider extends React.Component<SliderProps & WithStylesProps<typeof styles>> {
  containerRef: AnyBecauseTodo

  state = {
    currentState: 'initial',
  };

  jumpAnimationTimeoutId: AnyBecauseTodo = -1;

  componentDidMount() {
    if (this.containerRef) {
      this.containerRef.addEventListener('touchstart', preventPageScrolling, { passive: false });
    }
  }

  componentWillUnmount() {
    this.containerRef.removeEventListener('touchstart', preventPageScrolling, { passive: false });
    document.body.removeEventListener('mousemove', this.handleMouseMove);
    document.body.removeEventListener('mouseup', this.handleMouseUp);
    clearTimeout(this.jumpAnimationTimeoutId);
  }

  static getDerivedStateFromProps(nextProps: AnyBecauseTodo, prevState: AnyBecauseTodo) {
    if (nextProps.disabled) {
      return { currentState: 'disabled' };
    }

    if (!nextProps.disabled && prevState.currentState === 'disabled') {
      return { currentState: 'normal' };
    }

    return null;
  }

  handleKeyDown = (event: AnyBecauseTodo) => {
    const { min=0, max=100, value: currentValue=0 } = this.props;

    const onePercent = Math.abs((max - min) / 100);
    const step = this.props.step || onePercent;
    let value;

    switch (keycode(event)) {
      case 'home':
        value = min;
        break;
      case 'end':
        value = max;
        break;
      case 'page up':
        value = currentValue + onePercent * 10;
        break;
      case 'page down':
        value = currentValue - onePercent * 10;
        break;
      case 'right':
      case 'up':
        value = currentValue + step;
        break;
      case 'left':
      case 'down':
        value = currentValue - step;
        break;
      default:
        return;
    }

    event.preventDefault();

    value = clamp(value, min, max);

    this.emitChange(event, value);
  };

  handleFocus = () => {
    this.setState({ currentState: 'focused' });
  };

  handleBlur = () => {
    this.setState({ currentState: 'normal' });
  };

  handleClick = (event: AnyBecauseTodo) => {
    const { min=0, max=100, vertical } = this.props;
    const percent = calculatePercent(this.containerRef, event, !!vertical, this.isReverted());
    const value = percentToValue(percent, min, max);

    this.emitChange(event, value, () => {
      this.playJumpAnimation();
    });
  };

  handleTouchStart = (event: AnyBecauseTodo) => {
    event.preventDefault();
    this.setState({ currentState: 'activated' });

    document.body.addEventListener('touchend', this.handleMouseUp);

    if (typeof this.props.onDragStart === 'function') {
      this.props.onDragStart(event);
    }
  };

  handleMouseDown = (event: AnyBecauseTodo) => {
    event.preventDefault();
    this.setState({ currentState: 'activated' });

    document.body.addEventListener('mousemove', this.handleMouseMove);
    document.body.addEventListener('mouseup', this.handleMouseUp);

    if (typeof this.props.onDragStart === 'function') {
      this.props.onDragStart(event);
    }
  };

  handleMouseUp = (event: AnyBecauseTodo) => {
    this.setState({ currentState: 'normal' });

    document.body.removeEventListener('mousemove', this.handleMouseMove);
    document.body.removeEventListener('mouseup', this.handleMouseUp);
    document.body.removeEventListener('touchend', this.handleMouseUp);

    if (typeof this.props.onDragEnd === 'function') {
      this.props.onDragEnd(event);
    }
  };

  handleMouseMove = (event: AnyBecauseTodo) => {
    const { min, max, vertical } = this.props;
    const percent = calculatePercent(this.containerRef, event, !!vertical, this.isReverted());
    const value = percentToValue(percent, min, max);

    this.emitChange(event, value);
  };

  emitChange(event: AnyBecauseTodo, rawValue: AnyBecauseTodo, callback?: AnyBecauseTodo) {
    const { step, value: previousValue, onChange, disabled } = this.props;
    let value = rawValue;

    if (disabled) {
      return;
    }

    if (step) {
      value = roundToStep(rawValue, step);
    } else {
      value = Number(rawValue.toFixed(3));
    }

    if (typeof onChange === 'function' && value !== previousValue) {
      onChange(event, value);

      if (typeof callback === 'function') {
        callback();
      }
    }
  }

  calculateTrackAfterStyles(percent: number) {
    const { currentState } = this.state;

    switch (currentState) {
      case 'activated':
        return `calc(100% - ${percent === 0 ? 7 : 5}px)`;
      case 'disabled':
        return `calc(${100 - percent}% - 6px)`;
      default:
        return 'calc(100% - 5px)';
    }
  }

  calculateTrackBeforeStyles(percent: number) {
    const { currentState } = this.state;

    switch (currentState) {
      case 'disabled':
        return `calc(${percent}% - 6px)`;
      default:
        return `${percent}%`;
    }
  }

  playJumpAnimation() {
    this.setState({ currentState: 'jumped' }, () => {
      clearTimeout(this.jumpAnimationTimeoutId);
      this.jumpAnimationTimeoutId = setTimeout(() => {
        this.setState({ currentState: 'normal' });
      }, this.props.theme.transitions.duration.complex);
    });
  }

  isReverted() {
    return this.props.theme.direction === 'rtl';
  }

  render() {
    const { currentState } = this.state;
    const {
      className: classNameProp,
      classes,
      disabled,
      max=100,
      min=0,
      onChange,
      onDragEnd,
      onDragStart,
      step,
      theme,
      value=0,
      vertical,
      ...other
    } = this.props;

    const percent = clamp(((value - min) * 100) / (max - min));

    const commonClasses = {
      [classes.disabled]: disabled,
      [classes.jumped]: !disabled && currentState === 'jumped',
      [classes.focused]: !disabled && currentState === 'focused',
      [classes.activated]: !disabled && currentState === 'activated',
    };

    const className = classNames(
      classes.root,
      {
        [classes.vertical]: vertical,
        [classes.disabled]: disabled,
      },
      classNameProp,
    );

    const containerClasses = classNames(classes.container, {
      [classes.vertical]: vertical,
    });

    const trackBeforeClasses = classNames(classes.track, classes.trackBefore, commonClasses, {
      [classes.vertical]: vertical,
    });

    const trackAfterClasses = classNames(classes.track, classes.trackAfter, commonClasses, {
      [classes.vertical]: vertical,
    });

    const trackProperty = vertical ? 'height' : 'width';
    const horizontalMinimumPosition = theme.direction === 'ltr' ? 'left' : 'right';
    const thumbProperty = vertical ? 'top' : horizontalMinimumPosition;
    const inlineTrackBeforeStyles = { [trackProperty]: this.calculateTrackBeforeStyles(percent) };
    const inlineTrackAfterStyles = { [trackProperty]: this.calculateTrackAfterStyles(percent) };
    const inlineThumbStyles = { [thumbProperty]: `${percent}%` };

    const thumbClasses = classNames(classes.thumb, commonClasses);

    return (
      <div
        role="slider"
        className={className}
        aria-valuenow={value}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-orientation={vertical ? 'vertical' : 'horizontal'}
        onClick={this.handleClick}
        onMouseDown={this.handleMouseDown}
        onTouchStartCapture={this.handleTouchStart}
        onTouchMove={this.handleMouseMove}
        ref={ref => {
          this.containerRef = ReactDOM.findDOMNode(ref);
        }}
        {...other}
      >
        <div className={containerClasses}>
          <div className={trackBeforeClasses} style={inlineTrackBeforeStyles} />
          <ButtonBase
            className={thumbClasses}
            disableRipple
            style={inlineThumbStyles}
            onBlur={this.handleBlur}
            onKeyDown={this.handleKeyDown}
            onTouchStartCapture={this.handleTouchStart}
            onTouchMove={this.handleMouseMove}
            onFocusVisible={this.handleFocus}
          />
          <div className={trackAfterClasses} style={inlineTrackAfterStyles} />
        </div>
      </div>
    );
  }
}

export default withStyles(styles, withTheme(Slider));
