import React from 'react';
import classNames from 'classnames';
import { isFilled, isAdornedStart } from '../InputBase/utils';
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

export type FormControlContextType = AnyBecauseTodo;
export const FormControlContext = React.createContext<FormControlContextType|null>(null);

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

        if (isFilled((child as AnyBecauseTodo).props, true)) {
          this.state = {...this.state, filled: true};
        }

        const input = isMuiElement(child, ['Select']) ? (child as AnyBecauseTodo).props.input : child;

        if (input && isAdornedStart(input.props)) {
          this.state = {...this.state, adornedStart: true};
        }
      });
    }
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
      disabled,
      error,
      fullWidth,
      margin,
      required,
      variant,
      ...other
    } = this.props;
    const { adornedStart, filled, focused } = this.state;

    return (
      <FormControlContext.Provider value={{
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
      }}>
        <div
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
      </FormControlContext.Provider>
    );
  }
}

(FormControl as any).defaultProps = {
  disabled: false,
  error: false,
  fullWidth: false,
  margin: 'none',
  required: false,
  variant: 'standard',
};

export default withStyles(styles, FormControl);
