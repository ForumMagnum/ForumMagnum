import React from 'react';
import Checkbox from '@/lib/vendor/@material-ui/core/src/Checkbox';
import { Components } from '../../lib/vulcan-lib/components';
import classNames from 'classnames';
import { defineStyles, useStyles } from '../hooks/useStyles';
import type { TypedFieldApi } from './BaseAppForm';

const styles = defineStyles('TanStackCheckbox', (theme: ThemeType) => ({
  root: {
    marginRight: theme.spacing.unit * 3,
    marginTop: 5,
    display: 'flex',
    alignItems: 'center',
  },
  size: {
    width: 36,
    height: 0,
  },
  inline: {
    display: 'inline',
    cursor: 'pointer',
  },
}));

export type TanStackCheckboxProps = ({
  field: TypedFieldApi<boolean> | TypedFieldApi<boolean | null>;
}) & {
  label?: string;
  disabled?: boolean;
  className?: string;
}

export function TanStackCheckbox({
  field,
  label,
  disabled = false,
  className,
}: TanStackCheckboxProps) {
  const classes = useStyles(styles);

  const id = `checkbox-${field.name}`;

  return (
    <div className={classNames(classes.root, className)}>
      <Checkbox
        id={id}
        className={classes.size}
        checked={!!field.state.value}
        onChange={(_, checked) => field.handleChange(checked)}
        onBlur={field.handleBlur}
        disabled={disabled}
        disableRipple
      />
      {label && (
        <Components.Typography
          htmlFor={id}
          className={classes.inline}
          variant="body2"
          component="label"
        >
          {label}
        </Components.Typography>
      )}
    </div>
  );
}
