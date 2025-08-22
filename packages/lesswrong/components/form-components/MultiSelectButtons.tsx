import React from 'react';
import Button from '@/lib/vendor/@material-ui/core/src/Button';
import classnames from 'classnames';
import * as _ from 'underscore';
import { defineStyles, useStyles } from '../hooks/useStyles';
import type { TypedFieldApi } from '@/components/tanstack-form-components/BaseAppForm';

const styles = defineStyles('MultiSelectButtons', (theme: ThemeType) => ({
  button: {
    // TODO: Pick typography for this button. (This is just the typography that
    // Material UI v0 happened to use.)
    fontWeight: theme.isFriendlyUI ? 600 : 500,
    fontSize: "16px",
    fontFamily: theme.palette.fonts.sansSerifStack,

    borderRadius: 0,
    textTransform: "none",
    minWidth: 63,
  },
  label: {
    marginRight: 10,
  },

  selected: {
    color: theme.palette.buttons.primaryDarkText,
    textTransform: "none",
    fontWeight: theme.isFriendlyUI ? 500 : undefined,
    // TODO: This green is hardcoded, but it's k because it's only used for events
    backgroundColor: theme.palette.buttons.groupTypesMultiselect.background,

    "&:hover": {
      backgroundColor: theme.palette.buttons.groupTypesMultiselect.hoverBackground,
    },
  },

  notSelected: {
    textTransform: "none",
    color: theme.palette.text.dim60,
    backgroundColor: "transparent",

    "&:hover": {
      backgroundColor: theme.palette.panelBackground.hoverHighlightGrey,
    },
  },
}));

interface MultiSelectButtonsProps {
  field: TypedFieldApi<string[]> | TypedFieldApi<string[] | null | undefined>;
  label?: string;
  options: Array<{ value: string; label?: string }>;
  className?: string;
  disabled?: boolean;
}

export const MultiSelectButtons = ({
  field,
  label,
  options,
  className,
  disabled = false,
}: MultiSelectButtonsProps) => {
  const classes = useStyles(styles);

  const currentValue = field.state.value;

  const handleClick = (option: string) => {
    const newValue = currentValue?.includes(option)
      ? _.without(currentValue, option)
      : [...(currentValue ?? []), option];

    field.handleChange(newValue);
  };

  return <div className={classnames('multi-select-buttons', className)}>
    {label && <label className={classes.label}>{label}</label>}
    {options.map((option) => {
      const selected = currentValue?.includes(option.value) ?? false;
      return <Button
        className={classnames(
          classes.button,
          {
            [classes.selected]: selected,
            [classes.notSelected]: !selected,
          }
        )}
        disabled={disabled}
        onClick={() => handleClick(option.value)}
        onBlur={field.handleBlur}
        key={option.value}
      >
        {option.label || option.value}
      </Button>
    })}
  </div>
}
