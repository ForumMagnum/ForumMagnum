import React, { ReactNode, useState } from 'react';
import TextField, { TextFieldProps } from '@/lib/vendor/@material-ui/core/src/TextField/TextField';
import classnames from 'classnames';
import { defineStyles, useStyles } from '../hooks/useStyles';
import type { TypedFieldApi } from '@/components/tanstack-form-components/BaseAppForm';
import type { Updater } from '@tanstack/react-form';

const styles = defineStyles('MuiTextField', (theme: ThemeType) => ({
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

function getUpdatedNumericValue(event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
  const value = 'valueAsNumber' in event.target ? event.target.valueAsNumber : parseFloat(event.target.value);
  return isNaN(value) ? null : value;
}

interface MuiTextFieldProps<T extends string | string[] | number | null | undefined> {
  field: {
    name: TypedFieldApi<T>['name'];
    state: Pick<TypedFieldApi<T>['state'], 'value' | 'meta'>;
    handleChange: TypedFieldApi<T>['handleChange'];
    handleBlur: TypedFieldApi<T>['handleBlur'];
  }
  label?: string;
  children?: ReactNode;
  select?: boolean;
  defaultValue?: string | number;
  fullWidth?: boolean;
  multiLine?: boolean;
  rows?: number;
  variant?: "standard" | "outlined" | "filled";
  type?: "number";
  disabled?: boolean;
  InputLabelProps?: Partial<TextFieldProps['InputLabelProps']>;
  placeholder?: string;
  overrideClassName?: string;
  /** When true, the form field is only updated on blur instead of on every keystroke. */
  updateOnBlur?: boolean;
}

export function MuiTextField<T extends string | string[] | number | null | undefined>({
  field,
  label,
  children,
  select,
  defaultValue,
  fullWidth,
  multiLine,
  rows,
  variant,
  type,
  disabled = false,
  InputLabelProps,
  placeholder,
  overrideClassName: className,
  updateOnBlur = false,
}: MuiTextFieldProps<T>) {
  const classes = useStyles(styles);
  const [localValue, setLocalValue] = useState<string | number | undefined>(undefined);
  const isLocallyEditing = updateOnBlur && localValue !== undefined;

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const value = type === 'number' ? getUpdatedNumericValue(event) : event.target.value;
    if (updateOnBlur) {
      setLocalValue(value ?? undefined);
    } else {
      field.handleChange(value);
    }
  };

  const handleBlur = (_event: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (updateOnBlur && localValue !== undefined) {
      field.handleChange(localValue);
      setLocalValue(undefined);
    }
    field.handleBlur();
  };

  const displayValue = isLocallyEditing ? localValue : (field.state.value ?? "");
  const error = field.state.meta.errors[0];

  return (
    <TextField
      name={field.name}
      variant={variant || 'standard'}
      select={select}
      value={displayValue}
      defaultValue={defaultValue}
      label={label}
      onChange={handleChange}
      onBlur={handleBlur}
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
