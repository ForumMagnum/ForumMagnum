import React, { useCallback, useMemo } from 'react';
import classNames from 'classnames';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import without from 'lodash/without';
import type { TypedFieldApi } from '@/components/tanstack-form-components/BaseAppForm';

const styles = defineStyles("FormComponentCheckboxGroup", (theme: ThemeType) => ({
  root: {
    padding: '8px 0',
  },
  label: {
    fontSize: 14,
    fontWeight: 500,
    fontFamily: theme.typography.fontFamily,
    color: theme.palette.grey[800],
    lineHeight: 1.4,
    marginBottom: 8,
  },
  options: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 6,
  },
  option: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '5px 10px',
    borderRadius: 6,
    border: `1px solid ${theme.palette.greyAlpha(0.12)}`,
    cursor: 'pointer',
    transition: 'border-color 0.15s ease, background 0.15s ease',
    userSelect: 'none',
    '&:hover': {
      borderColor: theme.palette.greyAlpha(0.25),
      background: theme.palette.greyAlpha(0.03),
    },
  },
  optionChecked: {
    borderColor: theme.palette.primary.main,
    background: `${theme.palette.primary.main}0a`,
    '&:hover': {
      borderColor: theme.palette.primary.main,
      background: `${theme.palette.primary.main}12`,
    },
  },
  checkbox: {
    position: 'relative',
    width: 16,
    height: 16,
    borderRadius: 3,
    border: `1.5px solid ${theme.palette.greyAlpha(0.25)}`,
    flexShrink: 0,
    transition: 'border-color 0.15s ease, background 0.15s ease',
  },
  checkboxChecked: {
    background: theme.palette.primary.main,
    borderColor: theme.palette.primary.main,
    '&::after': {
      content: '""',
      position: 'absolute',
      left: 4,
      top: 1,
      width: 5,
      height: 9,
      border: `solid ${theme.palette.text.alwaysWhite}`,
      borderWidth: '0 2px 2px 0',
      transform: 'rotate(45deg)',
    },
  },
  optionLabel: {
    fontSize: 13,
    fontFamily: theme.typography.fontFamily,
    color: theme.palette.grey[700],
  },
}))

export const FormComponentCheckboxGroup = ({ field, label, options }: {
  field: TypedFieldApi<string[] | null | undefined>
  label: string
  options: Array<{value: string, label: string}>
}) => {
  const classes = useStyles(styles);
  const value = useMemo(() => field.state.value ?? [], [field.state.value]);

  const toggleOption = useCallback((optionValue: string) => {
    const newValue = value.includes(optionValue)
      ? without(value, optionValue)
      : [...value, optionValue];
    field.handleChange(newValue);
  }, [value, field]);

  return (
    <div className={classes.root}>
      <div className={classes.label}>{label}</div>
      <div className={classes.options}>
        {options.map(option => {
          const checked = value.includes(option.value);
          return (
            <div
              key={option.value}
              className={classNames(classes.option, checked && classes.optionChecked)}
              onClick={() => toggleOption(option.value)}
            >
              <div className={classNames(classes.checkbox, checked && classes.checkboxChecked)} />
              <span className={classes.optionLabel}>{option.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
