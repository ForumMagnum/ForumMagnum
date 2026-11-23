import React from 'react';
import classNames from 'classnames';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import KeystrokeDisplay from './KeystrokeDisplay';
import { commandButtonStyles } from './ModerationActionButton';

const styles = defineStyles('ComposerSubmitButton', (theme: ThemeType) => ({
  root: {
    ...commandButtonStyles(theme),
    display: 'inline-flex',
    border: `1px solid ${theme.palette.grey[300]}`,
    color: 'inherit',
    fontFamily: 'inherit',
    '&:not(:disabled):hover': {
      backgroundColor: theme.palette.grey[50],
      borderColor: theme.palette.grey[400],
    },
  },
  danger: {
    color: theme.palette.error.main,
  },
  disabled: {
    opacity: 0.5,
    cursor: 'default',
  },
}));

/**
 * Submit button for the supermod sidebar composers (Send DM / Reject): shows
 * a keystroke badge matching the actual keyboard shortcut, and is greyed out
 * while there's nothing to submit. Pass `danger` for destructive submits.
 */
const ComposerSubmitButton = ({ label, disabled, onClick, type = 'button', keystroke = 'Ctrl+Enter', danger = false }: {
  label: React.ReactNode,
  disabled: boolean,
  onClick?: () => void,
  type?: 'button' | 'submit',
  keystroke?: string,
  danger?: boolean,
}) => {
  const classes = useStyles(styles);
  return <button
    type={type}
    onClick={onClick}
    disabled={disabled}
    className={classNames(classes.root, { [classes.danger]: danger, [classes.disabled]: disabled })}
  >
    <KeystrokeDisplay keystroke={keystroke} />
    {label}
  </button>;
};

export default ComposerSubmitButton;
