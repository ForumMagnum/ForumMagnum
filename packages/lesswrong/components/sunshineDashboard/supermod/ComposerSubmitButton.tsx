import React from 'react';
import Button from '@/lib/vendor/@material-ui/core/src/Button';
import KeystrokeDisplay from './KeystrokeDisplay';

/**
 * Submit button for the supermod sidebar composers (Send DM / Reject): shows
 * a Ctrl+Enter badge matching the actual keyboard shortcut, and is greyed out
 * while the composer is empty.
 */
const ComposerSubmitButton = ({ label, disabled, onClick, type = 'button', keystroke = 'Ctrl+Enter' }: {
  label: React.ReactNode,
  disabled: boolean,
  onClick?: () => void,
  type?: 'button' | 'submit',
  keystroke?: string,
}) => {
  return <Button type={type} onClick={onClick} disabled={disabled}>
    {label}
    <KeystrokeDisplay keystroke={keystroke} withMargin splitBeforeTranslation />
  </Button>;
};

export default ComposerSubmitButton;
