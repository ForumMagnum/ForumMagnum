// @inheritedComponent IconButton

import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import IconButton from '../IconButton';
import { StandardProps } from '..';
import { IconButtonProps } from '../IconButton/IconButton';
import { defineStyles, withStyles } from '@/components/hooks/useStyles';

export interface SwitchBaseProps
  extends StandardProps<IconButtonProps, SwitchBaseClassKey, 'onChange'> {
  autoFocus?: boolean;
  checked?: boolean | string;
  checkedIcon: React.ReactNode;
  defaultChecked?: boolean;
  disabled?: boolean;
  disableRipple?: boolean;
  icon: React.ReactNode;
  inputProps?: React.InputHTMLAttributes<HTMLInputElement>;
  inputRef?: React.Ref<any>;
  name?: string;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>, checked: boolean) => void;
  readOnly?: boolean;
  required?: boolean;
  tabIndex?: number;
  value?: string;
}

export type SwitchBaseClassKey = 'root' | 'checked' | 'disabled' | 'input';

export interface CreateSwitchBaseOptions {
  defaultIcon?: React.ReactNode;
  defaultCheckedIcon?: React.ReactNode;
  type?: string;
}

export const styles = defineStyles("MuiSwitchBase", theme => ({
  root: {
    display: 'inline-flex',
    alignItems: 'center',
    transition: 'none',
    '&:hover': {
      // Disable the hover effect for the IconButton.
      backgroundColor: 'transparent',
    },
  },
  checked: {},
  disabled: {},
  input: {
    cursor: 'inherit',
    position: 'absolute',
    opacity: 0,
    width: '100%',
    height: '100%',
    top: 0,
    left: 0,
    margin: 0,
    padding: 0,
  },
}), {stylePriority: -10});

/**
 * @ignore - internal component.
 */
class SwitchBase extends React.Component<SwitchBaseProps & WithStylesProps<typeof styles>, {
  checked?: boolean
}> {
  isControlled: boolean

  constructor(props: SwitchBaseProps & WithStylesProps<typeof styles>) {
    super(props);
    this.isControlled = props.checked != null;
    this.state = {};
    if (!this.isControlled) {
      // not controlled, use internal state
      this.state = {
        checked: props.defaultChecked !== undefined ? props.defaultChecked : false
      };
    }
  }

  handleFocus = event => {
    if (this.props.onFocus) {
      this.props.onFocus(event);
    }

    const { muiFormControl } = this.context;
    if (muiFormControl && muiFormControl.onFocus) {
      muiFormControl.onFocus(event);
    }
  };

  handleBlur = event => {
    if (this.props.onBlur) {
      this.props.onBlur(event);
    }

    const { muiFormControl } = this.context;
    if (muiFormControl && muiFormControl.onBlur) {
      muiFormControl.onBlur(event);
    }
  };

  handleInputChange = event => {
    const checked = event.target.checked;

    if (!this.isControlled) {
      this.setState({ checked });
    }

    if (this.props.onChange) {
      this.props.onChange(event, checked);
    }
  };

  render() {
    const {
      autoFocus,
      checked: checkedProp,
      checkedIcon,
      classes,
      className: classNameProp,
      disabled: disabledProp,
      icon,
      id,
      inputProps,
      inputRef,
      name,
      onBlur,
      onChange,
      onFocus,
      readOnly,
      required,
      tabIndex,
      type,
      value,
      ...other
    } = this.props;

    const { muiFormControl } = this.context;
    let disabled = disabledProp;

    if (muiFormControl) {
      if (typeof disabled === 'undefined') {
        disabled = muiFormControl.disabled;
      }
    }

    const checked = this.isControlled ? checkedProp : this.state.checked;
    const hasLabelFor = type === 'checkbox' || type === 'radio';

    return (
      <IconButton
        component="span"
        className={classNames(
          classes.root,
          {
            [classes.checked]: checked,
            [classes.disabled]: disabled,
          },
          classNameProp,
        )}
        disabled={disabled}
        tabIndex={null}
        role={undefined}
        onFocus={this.handleFocus}
        onBlur={this.handleBlur}
        {...other}
      >
        {checked ? checkedIcon : icon}
        <input
          autoFocus={autoFocus}
          checked={checked}
          className={classes.input}
          disabled={disabled}
          id={hasLabelFor && id}
          name={name}
          onChange={this.handleInputChange}
          readOnly={readOnly}
          ref={inputRef}
          required={required}
          tabIndex={tabIndex}
          type={type}
          value={value}
          {...inputProps}
        />
      </IconButton>
    );
  }
}

SwitchBase.contextTypes = {
  muiFormControl: PropTypes.object,
};

export default withStyles(styles, SwitchBase);
