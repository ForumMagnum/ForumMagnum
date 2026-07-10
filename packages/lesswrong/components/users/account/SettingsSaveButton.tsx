import React from 'react';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import Loading from '../../vulcan-core/Loading';

const styles = defineStyles('SettingsSaveButton', (theme: ThemeType) => ({
  saveButton: {
    border: `1px solid ${theme.palette.primary.main}`,
    borderRadius: 6,
    padding: '8px 16px',
    fontSize: 13,
    fontWeight: 500,
    fontFamily: theme.typography.fontFamily,
    color: theme.palette.primary.main,
    background: 'none',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    transition: 'background 0.15s ease, color 0.15s ease',
    '&:hover': {
      background: theme.palette.primary.main,
      color: theme.palette.text.alwaysWhite,
    },
    '&:disabled': {
      opacity: 0.5,
      cursor: 'not-allowed',
    },
  },
}));

const SettingsSaveButton = ({saving, onClick}: {
  saving: boolean;
  onClick: () => void;
}) => {
  const classes = useStyles(styles);
  return (
    <button
      type="button"
      className={classes.saveButton}
      onClick={onClick}
      disabled={saving}
    >
      {saving ? <Loading /> : 'Save'}
    </button>
  );
};

export default SettingsSaveButton;
