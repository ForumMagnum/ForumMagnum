import React, { ChangeEventHandler } from 'react';
import { registerComponent } from '../../lib/vulcan-lib';
import TextField from '@material-ui/core/TextField';
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
