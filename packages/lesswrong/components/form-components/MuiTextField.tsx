import React, { ChangeEventHandler } from 'react';
import { registerComponent } from '../../lib/vulcan-lib';
import TextField, { TextFieldProps } from '@material-ui/core/TextField';
import classnames from 'classnames';

const styles = (theme: ThemeType): JssStyles => ({
  labelColor: {
    color: theme.secondary
  },
  textField: {
    fontSize: "15px",
    width: 350,
    [theme.breakpoints.down('sm')]: {
      width: "calc(100% - 30px)", // leaving 30px so that the "clear" button for select forms has room
    },
  },
  fullWidth: {
    width: "100%",
  }
})

const MuiTextField = ({
  classes,
  value,
  updateCurrentValues,
  path,
  children,
  select,
  defaultValue,
  label,
  fullWidth,
  multiLine,
  rows,
  variant,
  type,
  disabled=false,
  InputLabelProps
}: {
  classes: ClassesType;
  value: string;
  updateCurrentValues<T extends {}>(values: T) : void;
  path: string;
  children?: JSX.Element[];
  select?: boolean;
  defaultValue?: string | number;
  label?: string;
  fullWidth?: boolean;
  multiLine?: boolean;
  rows?: number;
  variant?: "standard" | "outlined" | "filled";
  type?: string;
  disabled?: boolean;
  InputLabelProps: Partial<TextFieldProps['InputLabelProps']>;
}) => {
  const onChange: ChangeEventHandler<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement> = (event) => {
    updateCurrentValues({
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
      className: classes.cssLabel,
      ...InputLabelProps
    }}
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
