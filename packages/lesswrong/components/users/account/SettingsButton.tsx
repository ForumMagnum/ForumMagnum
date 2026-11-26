import React from 'react';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';

const styles = defineStyles('SettingsButton', (theme: ThemeType) => ({
  root: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    border: `1px solid ${theme.palette.greyAlpha(0.2)}`,
    borderRadius: 6,
    padding: '8px 16px',
    fontSize: 13,
    fontWeight: 500,
    fontFamily: theme.typography.fontFamily,
    color: theme.palette.grey[700],
    background: 'none',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    transition: 'border-color 0.15s ease, color 0.15s ease',
    '&:hover:not(:disabled)': {
      borderColor: theme.palette.greyAlpha(0.4),
      color: theme.palette.grey[900],
      background: theme.palette.greyAlpha(0.03),
    },
    '&:disabled': {
      opacity: 0.5,
      cursor: 'not-allowed',
    },
  },
}));

/** A button for something a setting offers other than saving it, which is SettingsSaveButton's job */
const SettingsButton = ({ onClick, disabled, ariaLabel, children }: {
  onClick: () => void;
  disabled?: boolean;
  ariaLabel?: string;
  children: React.ReactNode;
}) => {
  const classes = useStyles(styles);
  return (
    <button type="button" className={classes.root} onClick={onClick} disabled={disabled} aria-label={ariaLabel}>
      {children}
    </button>
  );
};

export default SettingsButton;
