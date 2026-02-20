import React, { useCallback } from 'react';
import classNames from 'classnames';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import type { TypedFieldApi } from '@/components/tanstack-form-components/BaseAppForm';

const styles = defineStyles('SettingsToggleRow', (theme: ThemeType) => ({
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
  },
  labelArea: {
    flex: 1,
    minWidth: 0,
    cursor: 'pointer',
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
  // Custom toggle built to avoid the registerComponent pattern
  toggle: {
    position: 'relative',
    width: 36,
    minWidth: 36,
    height: 20,
    borderRadius: 10,
    cursor: 'pointer',
    transition: 'background 0.2s ease',
    flexShrink: 0,
  },
  toggleOff: {
    background: theme.palette.grey[300],
  },
  toggleOn: {
    background: theme.palette.primary.main,
  },
  toggleHandle: {
    position: 'absolute',
    top: 2,
    width: 16,
    height: 16,
    borderRadius: '50%',
    background: theme.palette.text.alwaysWhite,
    transition: 'left 0.2s ease',
    boxShadow: theme.palette.boxShadow.moreFocused,
  },
  toggleHandleOff: {
    left: 2,
  },
  toggleHandleOn: {
    left: 18,
  },
  disabled: {
    opacity: 0.45,
    pointerEvents: 'none',
  },
}));

interface SettingsToggleRowProps {
  field: TypedFieldApi<boolean> | TypedFieldApi<boolean | null | undefined>;
  label: string;
  description?: string;
  disabled?: boolean;
}

const SettingsToggleRow = ({
  field,
  label,
  description,
  disabled = false,
}: SettingsToggleRowProps) => {
  const classes = useStyles(styles);
  const isOn = !!field.state.value;

  const onToggle = useCallback(() => {
    field.handleChange(!field.state.value);
  }, [field]);

  return (
    <div className={classNames(classes.root, disabled && classes.disabled)}>
      <div className={classes.labelArea} onClick={onToggle}>
        <div className={classes.label}>{label}</div>
        {description && <div className={classes.description}>{description}</div>}
      </div>
      <div
        className={classNames(classes.toggle, isOn ? classes.toggleOn : classes.toggleOff)}
        onClick={onToggle}
      >
        <div className={classNames(classes.toggleHandle, isOn ? classes.toggleHandleOn : classes.toggleHandleOff)} />
      </div>
    </div>
  );
};

export default SettingsToggleRow;
