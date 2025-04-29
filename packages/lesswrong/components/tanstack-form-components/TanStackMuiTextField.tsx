import React, { ReactNode } from 'react';
import TextField, { TextFieldProps } from '@/lib/vendor/@material-ui/core/src/TextField';
import classnames from 'classnames';
import { defineStyles, useStyles } from '../hooks/useStyles';
import type { TypedFieldApi } from './BaseAppForm';
import type { Updater } from '@tanstack/react-form';

const styles = defineStyles('TanStackMuiTextField', (theme: ThemeType) => ({
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
}));

interface TanStackMuiTextFieldProps<T extends string | number | null | undefined> {
  field: TypedFieldApi<T>;
  label?: string;
  children?: ReactNode;
  select?: boolean;
  fullWidth?: boolean;
  multiLine?: boolean;
  rows?: number;
  variant?: "standard" | "outlined" | "filled";
  type?: string;
  disabled?: boolean;
  InputLabelProps?: Partial<TextFieldProps['InputLabelProps']>;
  placeholder?: string;
  overrideClassName?: string;
}

export function TanStackMuiTextField<T extends string | number | null | undefined>({
  field,
  label,
  children,
  select,
  fullWidth,
  multiLine,
  rows,
  variant,
  type,
  disabled = false,
  InputLabelProps,
  placeholder,
  overrideClassName: className,
}: TanStackMuiTextFieldProps<T>) {
  const classes = useStyles(styles);
  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const value = type === 'number' ? (event.target as HTMLInputElement).valueAsNumber : event.target.value;
    field.handleChange(value as Updater<T>);
  };

  const error = field.state.meta.errors[0];

  return (
    <TextField
      name={field.name}
      variant={variant || 'standard'}
      select={select}
      value={field.state.value ?? ""}
      label={label}
      onChange={handleChange}
      onBlur={field.handleBlur}
      multiline={multiLine}
      rows={rows}
      type={type}
      fullWidth={fullWidth}
      InputLabelProps={{
        ...InputLabelProps
      }}
      className={classnames(
        className ?? classes.textField,
        { [classes.fullWidth]: fullWidth }
      )}
      disabled={disabled}
      error={!!error}
      helperText={error?.message}
      placeholder={placeholder}
    >
      {children}
    </TextField>
  );
};

