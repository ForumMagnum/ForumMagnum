import React, { useState } from 'react';
import { DatePicker } from '@/components/form-components/FormComponentDateTime';
import { ClearInput } from '@/components/form-components/ClearInput';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import SettingsSaveButton from './SettingsSaveButton';
import type { UserSettingsSaveResult } from './useAutoSavedUserSettings';

const styles = defineStyles('ExplicitSaveDateSetting', (theme: ThemeType) => ({
  root: {
    padding: '12px 0',
    borderBottom: `1px solid ${theme.palette.greyAlpha(0.06)}`,
    '&:last-child': {
      borderBottom: 'none',
    },
  },
  pickerRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
}));

/**
 * A date setting with a deliberate save step: the picker edits a local draft,
 * and nothing persists until Save is clicked. Used instead of an autosaving
 * binding because date pickers fire onChange on partially-entered values.
 */
const ExplicitSaveDateSetting = ({
  label,
  value,
  confirmMessage,
  onSave,
}: {
  label: string;
  value: Date | string | null | undefined;
  /** If provided, ask for confirmation with this message before saving */
  confirmMessage?: (newValue: Date | null) => string;
  onSave: (value: Date | null) => Promise<UserSettingsSaveResult>;
}) => {
  const classes = useStyles(styles);
  const savedDate = value ? new Date(value) : null;
  const [draft, setDraft] = useState<Date | null>(savedDate);
  const [saving, setSaving] = useState(false);

  const isChanged = (draft?.getTime() ?? null) !== (savedDate?.getTime() ?? null);

  const handleSave = async () => {
    if (confirmMessage && !window.confirm(confirmMessage(draft))) {
      return;
    }
    setSaving(true);
    await onSave(draft);
    setSaving(false);
  };

  return (
    <div className={classes.root}>
      <div className={classes.pickerRow}>
        <DatePicker
          label={label}
          value={draft ?? undefined}
          onChange={setDraft}
        />
        {draft && <ClearInput clearField={() => setDraft(null)} />}
        {isChanged && <SettingsSaveButton saving={saving} onClick={() => void handleSave()} />}
      </div>
    </div>
  );
};

export default ExplicitSaveDateSetting;
