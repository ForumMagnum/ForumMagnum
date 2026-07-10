import React, { useEffect, useState } from 'react';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';

const styles = defineStyles('SettingsTextRow', (theme: ThemeType) => ({
  root: {
    padding: '12px 0',
    borderBottom: `1px solid ${theme.palette.greyAlpha(0.06)}`,
    '&:last-child': {
      borderBottom: 'none',
    },
  },
  label: {
    fontSize: 14,
    fontWeight: 500,
    fontFamily: theme.typography.fontFamily,
    color: theme.palette.grey[800],
    lineHeight: 1.4,
    marginBottom: 2,
  },
  description: {
    fontSize: 12.5,
    fontFamily: theme.typography.fontFamily,
    color: theme.palette.grey[500],
    lineHeight: 1.45,
    marginBottom: 8,
  },
  input: {
    width: '100%',
    maxWidth: 400,
    border: `1px solid ${theme.palette.greyAlpha(0.15)}`,
    borderRadius: 6,
    padding: '9px 12px',
    fontSize: 14,
    color: theme.palette.grey[900],
    background: theme.palette.panelBackground.default,
    transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
    fontFamily: theme.typography.fontFamily,
    '&:hover': {
      borderColor: theme.palette.greyAlpha(0.25),
    },
    '&:focus': {
      outline: 'none',
      borderColor: theme.palette.primary.main,
      boxShadow: `0 0 0 3px ${theme.palette.primary.main}22`,
    },
    '&::placeholder': {
      color: theme.palette.grey[400],
    },
    '&:disabled': {
      background: theme.palette.greyAlpha(0.04),
      color: theme.palette.grey[500],
      cursor: 'not-allowed',
    },
  },
}));

interface SettingsTextRowBaseProps {
  label: string;
  description?: string;
  placeholder?: string;
  disabled?: boolean;
}

type SettingsTextRowProps = SettingsTextRowBaseProps & (
  | {
      type?: 'text' | 'email';
      value: string | null | undefined;
      /** Called when the input loses focus (or Enter is pressed) with a changed value */
      onCommit: (value: string) => void;
    }
  | {
      type: 'number';
      value: number | null | undefined;
      onCommit: (value: number | null) => void;
    }
);

function SettingsTextRow(props: SettingsTextRowProps) {
  const { label, description, placeholder, disabled = false, value } = props;
  const classes = useStyles(styles);
  const [draft, setDraft] = useState(String(value ?? ''));
  const [focused, setFocused] = useState(false);

  // Reflect external changes (e.g. a failed save reverting) while not editing
  useEffect(() => {
    if (!focused) {
      setDraft(String(value ?? ''));
    }
  }, [value, focused]);

  const commitDraft = () => {
    if (props.type === 'number') {
      const parsed = draft === '' ? null : Number(draft);
      if (parsed !== null && isNaN(parsed)) {
        setDraft(String(props.value ?? ''));
        return;
      }
      if (parsed !== (props.value ?? null)) {
        props.onCommit(parsed);
      }
    } else {
      if (draft !== (props.value ?? '')) {
        props.onCommit(draft);
      }
    }
  };

  return (
    <div className={classes.root}>
      <div className={classes.label}>{label}</div>
      {description && <div className={classes.description}>{description}</div>}
      <input
        className={classes.input}
        type={props.type ?? 'text'}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={(e) => {
          setFocused(false);
          // For number inputs, invalid partial input (e.g. a lone "-") reads
          // as '' — restore the saved value rather than committing null
          if (e.currentTarget.validity.badInput) {
            setDraft(String(value ?? ''));
            return;
          }
          commitDraft();
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.currentTarget.blur();
          }
        }}
        placeholder={placeholder}
        disabled={disabled}
      />
    </div>
  );
}

export default SettingsTextRow;
