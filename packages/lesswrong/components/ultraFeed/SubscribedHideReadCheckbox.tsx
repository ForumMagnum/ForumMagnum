import React from 'react';
import classNames from 'classnames';
import Checkbox from '@/lib/vendor/@material-ui/core/src/Checkbox';
import { defineStyles, useStyles } from '../hooks/useStyles';

const styles = defineStyles('SubscribedHideReadCheckbox', (theme: ThemeType) => ({
  container: {
    display: 'flex',
    alignItems: 'center',
    color: theme.palette.grey[600],
    transition: 'opacity 0.3s ease, visibility 0.3s ease',
  },
  containerHidden: {
    opacity: 0,
    visibility: 'hidden',
    pointerEvents: 'none',
  },
  checkboxInput: {
    padding: 4,
    color: theme.palette.grey[500],
  },
  checkboxLabel: {
    cursor: 'pointer',
    fontSize: '1.15rem',
    fontFamily: theme.typography.fontFamily,
    textWrap: 'nowrap',
  },
}));

export type SubscribedHideReadCheckboxProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  visible?: boolean;
  disabled?: boolean;
  id?: string;
  label?: string;
  className?: string;
};

const SubscribedHideReadCheckbox = ({
  checked,
  onChange,
  visible = true,
  disabled = false,
  id = 'hideReadCheckbox',
  label = 'Hide Read',
  className,
}: SubscribedHideReadCheckboxProps) => {
  const classes = useStyles(styles);
  return (
    <div className={classNames(classes.container, !visible && classes.containerHidden, className)}>
      <Checkbox
        className={classes.checkboxInput}
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled || !visible}
      />
      <span className={classes.checkboxLabel}>
        {label}
      </span>
    </div>
  );
};

export default SubscribedHideReadCheckbox;

