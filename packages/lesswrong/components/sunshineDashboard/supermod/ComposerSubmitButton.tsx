import React from 'react';
import classNames from 'classnames';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import KeystrokeDisplay from './KeystrokeDisplay';

const styles = defineStyles('ComposerSubmitButton', (theme: ThemeType) => ({
  // These commit the composer, so they get the bordered affordance of
  // ModerationActionButton rather than the bare styling of the "More ..."
  // disclosure rows they sit under. Keep the left and vertical padding equal
  // so the keystroke chip sits evenly inside the rounded border.
  root: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    padding: '4px 6px 4px 4px',
    border: `1px solid ${theme.palette.grey[300]}`,
    borderRadius: 4,
    backgroundColor: theme.palette.background.paper,
    color: 'inherit',
    fontFamily: 'inherit',
    fontSize: 12,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    // :not(:disabled) so a button with nothing to submit gives no hover feedback,
    // whichever variant it is
    '&:not(:disabled):hover': {
      backgroundColor: theme.palette.grey[50],
      borderColor: theme.palette.grey[400],
    },
  },
  // Marks the destructive commit (rejecting content) apart from the benign one
  // without the weight of a filled button
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
