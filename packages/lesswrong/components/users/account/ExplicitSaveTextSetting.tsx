import React, { useState } from 'react';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import SettingsSaveButton from './SettingsSaveButton';
import type { UserSettingsSaveResult } from './useAutoSavedUserSettings';

const styles = defineStyles('ExplicitSaveTextSetting', (theme: ThemeType) => ({
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
  inputRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
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
  },
  error: {
    fontSize: 12.5,
    fontFamily: theme.typography.fontFamily,
    color: theme.palette.error.main,
    marginTop: 6,
  },
  note: {
    fontSize: 12.5,
    fontFamily: theme.typography.fontFamily,
    color: theme.palette.grey[600],
    marginTop: 6,
  },
}));

/**
 * A text setting with a deliberate save step, for fields where committing is
 * sensitive (display name is rate-limited, email changes affect account
 * recovery/verification). Server-side rejections are shown inline.
 */
const ExplicitSaveTextSetting = ({
  label,
  description,
  type = 'text',
  value,
  confirmMessage,
  savedNote,
  onSave,
}: {
  label: string;
  description?: string;
  type?: 'text' | 'email';
  value: string | null | undefined;
  /** If provided, ask for confirmation with this message before saving */
  confirmMessage?: (newValue: string) => string;
  /** Shown after a successful save */
  savedNote?: string;
  onSave: (value: string) => Promise<UserSettingsSaveResult>;
}) => {
  const classes = useStyles(styles);
  const [draft, setDraft] = useState(value ?? '');
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const isChanged = draft !== (value ?? '');

  const handleSave = async () => {
    if (confirmMessage && !window.confirm(confirmMessage(draft))) {
      return;
    }
    setSaving(true);
    setError(null);
    setNote(null);
    const result = await onSave(draft);
    setSaving(false);
    if (result.success) {
      setNote(savedNote ?? null);
    } else {
      setError(result.error);
    }
  };

  return (
    <div className={classes.root}>
      <div className={classes.label}>{label}</div>
      {description && <div className={classes.description}>{description}</div>}
      <div className={classes.inputRow}>
        <input
          className={classes.input}
          type={type}
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value);
            setNote(null);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && isChanged && !saving) {
              void handleSave();
            }
          }}
        />
        {isChanged && <SettingsSaveButton saving={saving} onClick={() => void handleSave()} />}
      </div>
      {error && <div className={classes.error}>{error}</div>}
      {note && <div className={classes.note}>{note}</div>}
    </div>
  );
};

export default ExplicitSaveTextSetting;
