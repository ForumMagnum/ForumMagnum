import React from 'react';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import LWTooltip from '@/components/common/LWTooltip';
import KeystrokeDisplay from './KeystrokeDisplay';
import classNames from 'classnames';

export const commandButtonStyles = (theme: ThemeType) => ({
  alignItems: 'center',
  gap: 8,
  padding: '4px 6px 4px 4px',
  borderRadius: 4,
  backgroundColor: theme.palette.background.paper,
  cursor: 'pointer',
  fontSize: 12,
  transition: 'all 0.15s ease',
});

export const activeCommandButtonStyles = (theme: ThemeType) => ({
  backgroundColor: theme.palette.error.light,
  color: theme.palette.error.contrastText,
  '&:hover': {
    backgroundColor: theme.palette.error.main,
  },
});

const styles = defineStyles('ModerationActionButton', (theme: ThemeType) => ({
  actionButton: {
    ...commandButtonStyles(theme),
    display: 'flex',
    justifyContent: 'flex-start',
    border: 0,
    '&:hover': {
      backgroundColor: theme.palette.grey[50],
    },
    '&.active': activeCommandButtonStyles(theme),
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
