import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { isFilled, isAdornedStart } from '../InputBase/utils';
import { capitalize } from '../utils/helpers';
import { isMuiElement } from '../utils/reactHelpers';
import { defineStyles, withStyles } from '@/components/hooks/useStyles';
import { StandardProps } from '..';

export interface FormControlProps
  extends StandardProps<React.HtmlHTMLAttributes<HTMLDivElement>, FormControlClassKey> {
  component?: React.ComponentType<FormControlProps>;
  disabled?: boolean;
  error?: boolean;
  fullWidth?: boolean;
  margin?: string
  onBlur?: React.EventHandler<any>;
  onFocus?: React.EventHandler<any>;
  required?: boolean;
  variant?: string;
  children?: React.ReactNode
}

export type FormControlClassKey = 'root' | 'marginNormal' | 'marginDense' | 'fullWidth';

export const styles = defineStyles("MuiFormControl", theme => ({
  /* Styles applied to the root element. */
  root: {
    display: 'inline-flex',
    flexDirection: 'column',
    position: 'relative',
    // Reset fieldset default style.
    minWidth: 0,
    padding: 0,
    margin: 0,
    border: 0,
    verticalAlign: 'top', // Fix alignment issue on Safari.
  },
  /* Styles applied to the root element if `margin="normal"`. */
  marginNormal: {
    marginTop: 16,
    marginBottom: 8,
  },
  /* Styles applied to the root element if `margin="dense"`. */
  marginDense: {
    marginTop: 8,
    marginBottom: 4,
  },
  /* Styles applied to the root element if `fullWidth={true}`. */
  fullWidth: {
    width: '100%',
  },
}), {stylePriority: -10});

/**
 * Provides context such as filled/focused/error/required for form inputs.
 * Relying on the context provides high flexibilty and ensures that the state always stays
 * consistent across the children of the `FormControl`.
 * This context is used by the following components:
 *  - FormLabel
 *  - FormHelperText
 *  - Input
 *  - InputLabel
 */
class FormControl extends React.Component<FormControlProps & WithStylesProps<typeof styles>, {
  adornedStart: boolean
  filled: boolean
  focused: boolean
}> {
  constructor(props: FormControlProps & WithStylesProps<typeof styles>) {
    super(props);

    this.state = {
      adornedStart: false,
      filled: false,
      focused: false,
    };

    // We need to iterate through the children and find the Input in order
    // to fully support server side rendering.
    const { children } = props;
    if (children) {
      React.Children.forEach(children, child => {
        if (!isMuiElement(child, ['Input', 'Select'])) {
          return;
        }

        if (isFilled(child.props, true)) {
          this.state = {...this.state, filled: true};
        }

        const input = isMuiElement(child, ['Select']) ? child.props.input : child;

        if (input && isAdornedStart(input.props)) {
          this.state = {...this.state, adornedStart: true};
        }
      });
    }
  }

  getChildContext() {
    const { disabled, error, required, margin, variant } = this.props;
    const { adornedStart, filled, focused } = this.state;

    return {
      muiFormControl: {
        adornedStart,
        disabled,
        error,
        filled,
        focused,
        margin,
        onBlur: this.handleBlur,
        onEmpty: this.handleClean,
        onFilled: this.handleDirty,
        onFocus: this.handleFocus,
        required,
        variant,
      },
    };
  }

  handleFocus = () => {
    this.setState(state => (!state.focused ? { focused: true } : null));
  };

  handleBlur = () => {
    this.setState(state => (state.focused ? { focused: false } : null));
  };

  handleDirty = () => {
    if (!this.state.filled) {
      this.setState({ filled: true });
    }
  };

  handleClean = () => {
    if (this.state.filled) {
      this.setState({ filled: false });
    }
  };

  render() {
    const {
      classes,
      className,
      component: Component,
      disabled,
      error,
      fullWidth,
      margin,
      required,
      variant,
      ...other
    } = this.props;

    return (
      <Component
        className={classNames(
          classes.root,
          {
            [classes[`marginNormal`]]: margin === 'normal',
            [classes[`marginDense`]]: margin === 'dense',
            [classes.fullWidth]: fullWidth,
          },
          className,
        )}
        {...other}
      />
    );
  }
}

FormControl.defaultProps = {
  component: 'div',
  disabled: false,
  error: false,
  fullWidth: false,
  margin: 'none',
  required: false,
  variant: 'standard',
};

FormControl.childContextTypes = {
  muiFormControl: PropTypes.object,
};

export default withStyles(styles, FormControl);
