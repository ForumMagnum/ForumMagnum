import React, { ChangeEventHandler, ReactNode } from 'react';
import { registerComponent } from '../../lib/vulcan-lib';
import TextField, { TextFieldProps } from '@material-ui/core/TextField';
import classnames from 'classnames';

const styles = (theme: ThemeType): JssStyles => ({
  labelColor: {
    color: theme.secondary
  },
  textField: textFieldStyles(theme),
  fullWidth: {
    width: "100%",
  }
})

export const textFieldStyles = (theme: ThemeType): JssStyles => ({
  fontSize: theme.typography.body2.fontSize,
  width: "100%",

  "& .MuiInputLabel-root" : {
    transform: "translate(0,8px) scale(1)",
  },
  "& .MuiInputLabel-root[data-shrink='true']" : {
    marginTop: '0.2em',
    transform: 'translate(0,-6px) scale(.857)',
  },
  "& .MuiInputBase-input" : {
    fontWeight: 600,
    marginTop: 10,
    marginBottom: -6,
  },
  "& label + .MuiInput-formControl" :{
    marginTop: 0,
  },
  "& .MuiFormLabel-root, .MuiInputBase-input": {
    fontSize: theme.typography.body2.fontSize,
    fontWeight: 600,
  },
  "& .MuiFormLabel-root": {
    color: theme.palette.grey[340],
  },
})

export const textFieldContainerStyles = (theme: ThemeType): JssStyles => ({
  background: "white",
  borderRadius: 6,
  paddingLeft: "1em",
  paddingRight: "1em",
  paddingTop: "0.7em",
  paddingBottom: "0.7em",
})

const MuiTextField = ({ value, updateCurrentValues, path, children, select, defaultValue, label, fullWidth=true, multiLine, rows, variant, type, disabled=false, InputLabelProps, InputProps={disableUnderline: true}, classes }: FormComponentProps<string> & {
  children?: ReactNode;
  select?: boolean;
  defaultValue?: string | number;
  fullWidth?: boolean;
  multiLine?: boolean;
  rows?: number;
  variant?: "standard" | "outlined" | "filled";
  type?: string;
  InputLabelProps?: Partial<TextFieldProps['InputLabelProps']>;
  InputProps?: TextFieldProps['InputProps'],
  classes: ClassesType;
}) => {
  const onChange: ChangeEventHandler<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement> = (event) => {
    void updateCurrentValues({
      [path]: event.target.value
    })
  }

  return <TextField
    variant={variant || 'standard'}
    select={select}
    value={value ?? ""}
    defaultValue={defaultValue}
    label={label}
    onChange={onChange}
    multiline={multiLine}
    rows={rows}
    type={type}
    fullWidth={fullWidth}
    InputLabelProps={{
      className: classes.cssLabel + " mui-input-label",
      ...InputLabelProps
    }}
    InputProps={InputProps}
    className={classnames(
      classes.textField,
      {[classes.fullWidth] :fullWidth}
    )}
    disabled={disabled}
  >
    {children}
  </TextField>
};

const MuiTextFieldComponent = registerComponent("MuiTextField", MuiTextField, {styles});

declare global {
  interface ComponentTypes {
    MuiTextField: typeof MuiTextFieldComponent
  }
}
