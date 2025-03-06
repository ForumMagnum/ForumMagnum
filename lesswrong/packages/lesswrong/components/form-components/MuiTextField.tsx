import React, { ChangeEventHandler, ReactNode } from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import classnames from 'classnames';
import { TextField, TextFieldProps } from "@/components/mui-replacement";

const styles = (theme: ThemeType) => ({
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

const MuiTextField = ({ value, updateCurrentValues, path, children, select, defaultValue, label, fullWidth, multiLine, rows, variant, type, disabled=false, InputLabelProps, classes }: FormComponentProps<string> & {
  children?: ReactNode;
  select?: boolean;
  defaultValue?: string | number;
  fullWidth?: boolean;
  multiLine?: boolean;
  rows?: number;
  variant?: "standard" | "outlined" | "filled";
  type?: string;
  InputLabelProps?: Partial<TextFieldProps['InputLabelProps']>;
  classes: ClassesType<typeof styles>;
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

export default MuiTextFieldComponent;
