import React from 'react';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import LWTooltip from '@/components/common/LWTooltip';
import KeystrokeDisplay from './KeystrokeDisplay';
import type { ModeratorActionHighlightStyle } from './actionHighlightRules';
import classNames from 'classnames';

/**
 * Outline treatments for highlighted moderator action buttons; class names match
 * `ModeratorActionHighlightStyle`. Also spread into ModerationPermissionButtons'
 * styles so the Message permission button can be highlighted the same way.
 */
export const moderatorActionHighlightStyles = (theme: ThemeType) => ({
  subtleOutline: {
    borderColor: theme.palette.grey[600],
    '&:hover': {
      borderColor: theme.palette.grey[700],
    },
  },
  green: {
    borderColor: theme.palette.primary.main,
    boxShadow: `0 0 0 1px ${theme.palette.primary.main}`,
    '&:hover': {
      borderColor: theme.palette.primary.main,
    },
  },
  gold: {
    borderColor: theme.palette.bookPromotion.starGold,
    boxShadow: `0 0 0 1px ${theme.palette.bookPromotion.starGold}`,
    '&:hover': {
      borderColor: theme.palette.bookPromotion.starGold,
    },
  },
  black: {
    borderColor: theme.palette.grey[900],
    boxShadow: `0 0 0 1px ${theme.palette.grey[900]}`,
    '&:hover': {
      borderColor: theme.palette.grey[900],
    },
  },
  red: {
    borderColor: theme.palette.error.main,
    boxShadow: `0 0 0 1px ${theme.palette.error.main}`,
    '&:hover': {
      borderColor: theme.palette.error.main,
    },
  },
});

const styles = defineStyles('ModerationActionButton', (theme: ThemeType) => ({
  actionButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 4,
    padding: '4px 4px 4px 6px',
    border: `1px solid ${theme.palette.grey[300]}`,
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
  ...moderatorActionHighlightStyles(theme),
}));

const ModerationActionButton = ({label, keystroke, tooltip, onClick, active=false, highlightStyle=null}: {
  label: string;
  keystroke: string;
  tooltip: string;
  onClick: () => void;
  active?: boolean;
  highlightStyle?: ModeratorActionHighlightStyle | null;
}) => {
  const classes = useStyles(styles);
  return (
    <LWTooltip title={tooltip} placement="left">
      <div className={classNames(classes.actionButton, active && 'active', highlightStyle && classes[highlightStyle])} onClick={onClick}>
        <span>{label}</span>
        <KeystrokeDisplay keystroke={keystroke} splitBeforeTranslation activeContext={active} />
      </div>
    </LWTooltip>
  );
};

export default ModerationActionButton;
