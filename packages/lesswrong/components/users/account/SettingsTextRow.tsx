import React from 'react';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import type { TypedFieldApi } from '@/components/tanstack-form-components/BaseAppForm';
import type { Updater } from '@tanstack/react-form';

const styles = defineStyles('SettingsTextRow', (theme: ThemeType) => ({
  root: {
    padding: '12px 0',
    borderBottom: `1px solid ${theme.palette.greyAlpha(0.06)}`,
    '&:last-child': {
      borderBottom: 'none',
    },
  },
  label: {
    fontSize: 14,
    fontWeight: 500,
    fontFamily: theme.typography.fontFamily,
    color: theme.palette.grey[800],
    lineHeight: 1.4,
    marginBottom: 2,
  },
  description: {
    fontSize: 12.5,
    fontFamily: theme.typography.fontFamily,
    color: theme.palette.grey[500],
    lineHeight: 1.45,
    marginBottom: 8,
  },
  input: {
    width: '100%',
    maxWidth: 400,
    border: `1px solid ${theme.palette.greyAlpha(0.15)}`,
    borderRadius: 6,
    padding: '9px 12px',
    fontSize: 14,
    color: theme.palette.grey[900],
    background: theme.palette.panelBackground.default,
    transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
    fontFamily: theme.typography.fontFamily,
    '&:hover': {
      borderColor: theme.palette.greyAlpha(0.25),
    },
    '&:focus': {
      outline: 'none',
      borderColor: theme.palette.primary.main,
      boxShadow: `0 0 0 3px ${theme.palette.primary.main}22`,
    },
    '&::placeholder': {
      color: theme.palette.grey[400],
    },
    '&:disabled': {
      background: theme.palette.greyAlpha(0.04),
      color: theme.palette.grey[500],
      cursor: 'not-allowed',
    },
  },
  error: {
    fontSize: 12,
    fontFamily: theme.typography.fontFamily,
    color: theme.palette.error.main,
    marginTop: 4,
  },
}));

interface SettingsTextRowProps<T extends string | number | null | undefined> {
  field: {
    name: TypedFieldApi<T>['name'];
    state: Pick<TypedFieldApi<T>['state'], 'value' | 'meta'>;
    handleChange: TypedFieldApi<T>['handleChange'];
    handleBlur: TypedFieldApi<T>['handleBlur'];
  };
  label: string;
  description?: string;
  placeholder?: string;
  disabled?: boolean;
  type?: 'text' | 'number' | 'email';
}

function SettingsTextRow<T extends string | number | null | undefined>({
  field,
  label,
  description,
  placeholder,
  disabled = false,
  type = 'text',
}: SettingsTextRowProps<T>) {
  const classes = useStyles(styles);
  const error = field.state.meta.errors[0];

  return (
    <div className={classes.root}>
      <div className={classes.label}>{label}</div>
      {description && <div className={classes.description}>{description}</div>}
      <input
        className={classes.input}
        name={field.name}
        type={type}
        value={field.state.value ?? ''}
        onChange={(e) => {
          const value = type === 'number'
            ? (isNaN(Number(e.target.value)) ? null : Number(e.target.value))
            : e.target.value;
          field.handleChange(value as Updater<T>);
        }}
        onBlur={field.handleBlur}
        placeholder={placeholder}
        disabled={disabled}
      />
      {error && <div className={classes.error}>{typeof error === 'string' ? error : error.message}</div>}
    </div>
  );
}

export default SettingsTextRow;
