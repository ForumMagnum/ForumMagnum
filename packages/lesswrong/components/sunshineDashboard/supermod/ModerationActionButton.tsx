import React from 'react';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import LWTooltip from '@/components/common/LWTooltip';
import KeystrokeDisplay from './KeystrokeDisplay';
import classNames from 'classnames';

const styles = defineStyles('ModerationActionButton', (theme: ThemeType) => ({
  actionButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 8,
    padding: '4px 6px 4px 4px',
    border: 0,
    borderRadius: 4,
    backgroundColor: theme.palette.background.paper,
    cursor: 'pointer',
    fontSize: 12,
    transition: 'all 0.15s ease',
    '&:hover': {
      backgroundColor: theme.palette.grey[50],
      borderColor: theme.palette.grey[400],
    },
    '&.active': {
      backgroundColor: theme.palette.error.light,
      borderColor: theme.palette.error.main,
      color: theme.palette.error.contrastText,
      '&:hover': {
        backgroundColor: theme.palette.error.main,
      },
    },
  },
}));

const ModerationActionButton = ({label, keystroke, tooltip, onClick, active=false}: {
  label: string;
  keystroke: string;
  tooltip: string;
  onClick: () => void;
  active?: boolean;
}) => {
  const classes = useStyles(styles);
  return (
    <LWTooltip title={tooltip} placement="left">
      <div
        className={classNames(
          classes.actionButton,
          active && 'active',
        )}
        onClick={onClick}
      >
        <KeystrokeDisplay keystroke={keystroke} activeContext={active} />
        <span>{label}</span>
      </div>
    </LWTooltip>
  );
};

export default ModerationActionButton;
