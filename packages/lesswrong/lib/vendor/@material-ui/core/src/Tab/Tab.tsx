// @inheritedComponent ButtonBase

import React from 'react';
import classNames from 'classnames';
import ButtonBase from '../ButtonBase';
import { capitalize } from '../utils/helpers';
import type { StandardProps } from '..';
import type { ButtonBaseProps } from '../ButtonBase/ButtonBase';
import { defineStyles, withStyles } from '@/components/hooks/useStyles';

export interface TabProps extends StandardProps<ButtonBaseProps, TabClassKey, 'onChange'> {
  disabled?: boolean;
  fullWidth?: boolean;
  icon?: string | React.ReactElement<any>;
  value?: any;
  label?: React.ReactNode;
  onChange?: (event: React.ChangeEvent<{ checked: boolean }>, value: any) => void;
  onClick?: React.EventHandler<any>;
  selected?: boolean;
  style?: React.CSSProperties;
  textColor?: string | 'secondary' | 'primary' | 'inherit';
}

export type TabClassKey =
  | 'root'
  | 'labelIcon'
  | 'textColorInherit'
  | 'textColorPrimary'
  | 'textColorSecondary'
  | 'selected'
  | 'disabled'
  | 'fullWidth'
  | 'wrapper'
  | 'labelContainer'
  | 'label'
  | 'labelWrapped';

const styles = defineStyles("MuiTab", theme => ({
  /* Styles applied to the root element. */
  root: {
    ...theme.typography.button,
    maxWidth: 264,
    position: 'relative',
    minWidth: 72,
    padding: 0,
    minHeight: 48,
    flexShrink: 0,
    overflow: 'hidden',
    whiteSpace: 'normal',
    [theme.breakpoints.up('md')]: {
      fontSize: theme.typography.pxToRem(13),
      minWidth: 160,
    },
  },
  /* Styles applied to the root element if both `icon` and `label` are provided. */
  labelIcon: {
    minHeight: 72,
  },
  /* Styles applied to the root element if `textColor="inherit"`. */
  textColorInherit: {
    color: 'inherit',
    opacity: 0.7,
    '&$selected': {
      opacity: 1,
    },
    '&$disabled': {
      opacity: 0.4,
    },
  },
  /* Styles applied to the root element if `textColor="primary"`. */
  textColorPrimary: {
    color: theme.palette.text.secondary,
    '&$selected': {
      color: theme.palette.primary.main,
    },
    '&$disabled': {
      color: theme.palette.text.disabled,
    },
  },
  /* Styles applied to the root element if `textColor="secondary"`. */
  textColorSecondary: {
    color: theme.palette.text.secondary,
    '&$selected': {
      color: theme.palette.secondary.main,
    },
    '&$disabled': {
      color: theme.palette.text.disabled,
    },
  },
  /* Styles applied to the root element if `selected={true}` (controlled by the Tabs component). */
  selected: {},
  /* Styles applied to the root element if `disabled={true}` (controlled by the Tabs component). */
  disabled: {},
  /* Styles applied to the root element if `fullWidth={true}` (controlled by the Tabs component). */
  fullWidth: {
    flexShrink: 1,
    flexGrow: 1,
    maxWidth: 'none',
  },
  /* Styles applied to the `icon` and `label`'s wrapper element. */
  wrapper: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    flexDirection: 'column',
  },
  /* Styles applied to the label container element if `label` is provided. */
  labelContainer: {
    paddingTop: 6,
    paddingBottom: 6,
    paddingLeft: 12,
    paddingRight: 12,
    [theme.breakpoints.up('md')]: {
      paddingLeft: 24,
      paddingRight: 24,
    },
  },
  /* Styles applied to the label wrapper element if `label` is provided. */
  label: {},
  /* Styles applied to the label wrapper element if `label` is provided and the text is wrapped. */
  labelWrapped: {
    [theme.breakpoints.down('sm')]: {
      fontSize: theme.typography.pxToRem(12),
    },
  },
}), {stylePriority: -10});

class Tab extends React.Component<TabProps & WithStylesProps<typeof styles>> {
  labelRef: AnyBecauseTodo
  state = {
    labelWrapped: false,
  };

  componentDidMount() {
    this.checkTextWrap();
  }

  componentDidUpdate(prevProps: AnyBecauseTodo, prevState: AnyBecauseTodo) {
    if (this.state.labelWrapped === prevState.labelWrapped) {
      /**
       * At certain text and tab lengths, a larger font size may wrap to two lines while the smaller
       * font size still only requires one line.  This check will prevent an infinite render loop
       * fron occurring in that scenario.
       */
      this.checkTextWrap();
    }
  }

  handleChange = (event: AnyBecauseTodo) => {
    const { onChange, value, onClick } = this.props;

    if (onChange) {
      onChange(event, value);
    }

    if (onClick) {
      onClick(event);
    }
  };

  checkTextWrap = () => {
    if (this.labelRef) {
      const labelWrapped = this.labelRef.getClientRects().length > 1;
      if (this.state.labelWrapped !== labelWrapped) {
        this.setState({ labelWrapped });
      }
    }
  };

  render() {
    const {
      classes,
      className: classNameProp,
      disabled=false,
      fullWidth,
      icon,
      label: labelProp,
      onChange,
      selected,
      textColor="inherit",
      value,
      ...other
    } = this.props;

    let label;

    if (labelProp !== undefined) {
      label = (
        <span className={classes.labelContainer}>
          <span
            className={classNames(classes.label, {
              [classes.labelWrapped]: this.state.labelWrapped,
            })}
            ref={ref => {
              this.labelRef = ref;
            }}
          >
            {labelProp}
          </span>
        </span>
      );
    }

    const className = classNames(
      classes.root,
      {
        [classes.textColorInherit]: textColor === 'inherit',
        [classes.textColorPrimary]: textColor === 'primary',
        [classes.textColorSecondary]: textColor === 'secondary',
        [classes.disabled]: disabled,
        [classes.selected]: selected,
        [classes.labelIcon]: icon && label,
        [classes.fullWidth]: fullWidth,
      },
      classNameProp,
    );

    return (
      <ButtonBase
        focusRipple
        className={className}
        role="tab"
        aria-selected={selected}
        disabled={disabled}
        {...other}
        onClick={this.handleChange}
      >
        <span className={classes.wrapper}>
          {icon}
          {label}
        </span>
      </ButtonBase>
    );
  }
}

export default withStyles(styles, Tab);
