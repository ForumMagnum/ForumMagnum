import React from 'react';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import type { TypedFieldApi } from '@/components/tanstack-form-components/BaseAppForm';

const styles = defineStyles('SettingsSelectRow', (theme: ThemeType) => ({
  root: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 24,
    padding: '12px 0',
    borderBottom: `1px solid ${theme.palette.greyAlpha(0.06)}`,
    '&:last-child': {
      borderBottom: 'none',
    },
    [theme.breakpoints.down('xs')]: {
      flexDirection: 'column',
      alignItems: 'flex-start',
      gap: 8,
    },
  },
  labelArea: {
    flex: 1,
    minWidth: 0,
  },
  label: {
    fontSize: 14,
    fontWeight: 500,
    fontFamily: theme.typography.fontFamily,
    color: theme.palette.grey[800],
    lineHeight: 1.4,
  },
  description: {
    fontSize: 12.5,
    fontFamily: theme.typography.fontFamily,
    color: theme.palette.grey[500],
    lineHeight: 1.45,
    marginTop: 2,
  },
  selectWrapper: {
    flexShrink: 0,
    [theme.breakpoints.down('xs')]: {
      width: '100%',
    },
  },
  select: {
    appearance: 'none',
    border: `1px solid ${theme.palette.greyAlpha(0.15)}`,
    borderRadius: 6,
    padding: '6px 32px 6px 12px',
    fontSize: 13,
    color: theme.palette.grey[800],
    background: `${theme.palette.panelBackground.default} url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%23666'/%3E%3C/svg%3E") no-repeat right 10px center`,
    cursor: 'pointer',
    transition: 'border-color 0.15s ease',
    fontFamily: theme.typography.fontFamily,
    maxWidth: '100%',
    '&:hover': {
      borderColor: theme.palette.greyAlpha(0.3),
    },
    '&:focus': {
      outline: 'none',
      borderColor: theme.palette.primary.main,
    },
    [theme.breakpoints.down('xs')]: {
      width: '100%',
    },
  },
}));

interface SelectOption {
  label: string;
  value: string | number;
}

interface SettingsSelectRowProps {
  field: {
    name: TypedFieldApi<string | number | null | undefined>['name'];
    state: Pick<TypedFieldApi<string | number | null | undefined>['state'], 'value' | 'meta'>;
    handleChange: TypedFieldApi<string | number | null | undefined>['handleChange'];
    handleBlur: TypedFieldApi<string | number | null | undefined>['handleBlur'];
  };
  label: string;
  description?: string;
  options: SelectOption[] | readonly SelectOption[];
}

const SettingsSelectRow = ({
  field,
  label,
  description,
  options,
}: SettingsSelectRowProps) => {
  const classes = useStyles(styles);

  return (
    <div className={classes.root}>
      <div className={classes.labelArea}>
        <div className={classes.label}>{label}</div>
        {description && <div className={classes.description}>{description}</div>}
      </div>
      <div className={classes.selectWrapper}>
        <select
          className={classes.select}
          value={field.state.value ?? ''}
          onChange={(e) => field.handleChange(e.target.value)}
          onBlur={field.handleBlur}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default SettingsSelectRow;
