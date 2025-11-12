import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { defineStyles, useStyles } from '../hooks/useStyles';
import LWDialog from '../common/LWDialog';
import { DialogContent } from '../widgets/DialogContent';
import { DialogActions } from '../widgets/DialogActions';
import { UnifiedScoringSettings } from './settingsComponents/UltraFeedSettingsComponents';
import { UnifiedScoringFormState, DEFAULT_SETTINGS } from './ultraFeedSettingsTypes';
import { ValidatedUnifiedScoring, unifiedScoringSchema } from './ultraFeedSettingsValidation';
import { ZodFormattedError } from 'zod';
import { useMessages } from '../common/withMessages';
import { useUltraFeedSettings } from '../hooks/useUltraFeedSettings';
import mergeWith from 'lodash/mergeWith';
import cloneDeep from 'lodash/cloneDeep';
import isEqual from 'lodash/isEqual';
import classNames from 'classnames';
import { parseNumericInputAsZeroOrNumber, customNullishCoalesceProperties, processNumericFieldInput } from './ultraFeedSettingsUtils';

const styles = defineStyles('AlterBonusesDialog', (theme: ThemeType) => ({
  dialogContent: {
    minWidth: 500,
    maxWidth: 700,
    [theme.breakpoints.down('sm')]: {
      minWidth: 'auto',
    },
  },
  compactSettingGroup: {
    backgroundColor: theme.palette.background.paper,
    width: '100%',
    padding: `16px 16px 0 16px`,
    borderRadius: 4,
  },
  button: {
    padding: '8px 16px',
    fontSize: '1.1rem',
    fontFamily: theme.palette.fonts.sansSerifStack,
    borderRadius: 4,
    cursor: 'pointer',
    border: 'none',
    fontWeight: 500,
  },
  cancelButton: {
    backgroundColor: theme.palette.grey[300],
    color: theme.palette.text.primary,
    '&:hover': {
      backgroundColor: theme.palette.grey[400],
    },
  },
  saveButton: {
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.background.paper,
    '&:hover': {
      backgroundColor: theme.palette.primary.dark,
    },
  },
  buttonDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
  actionsContent: {
    paddingRight: 16,
    paddingBottom: 16,
    display: 'flex',
    width: '100%',
    justifyContent: 'flex-end',
    gap: 12,
    alignItems: 'center',
  },
  unsavedChangesIndicator: {
    fontFamily: theme.palette.fonts.sansSerifStack,
    color: theme.palette.warning.main,
    fontSize: 16,
    fontStyle: 'italic',
  },
  buttonGroup: {
    display: 'flex',
    gap: 8,
  },
}));

const AlterBonusesDialog = ({ open, onClose, className }: { open: boolean; onClose: () => void; className?: string }) => {
  const classes = useStyles(styles);
  const { settings, updateSettings } = useUltraFeedSettings();
  const { flash } = useMessages();

  const defaultUnifiedScoring = DEFAULT_SETTINGS.resolverSettings.unifiedScoring;

  const initialFormState: UnifiedScoringFormState = useMemo(() => {
    return mergeWith(
      cloneDeep(defaultUnifiedScoring),
      settings?.resolverSettings?.unifiedScoring,
      customNullishCoalesceProperties
    );
  }, [settings, defaultUnifiedScoring]);

  const [formValues, setFormValues] = useState<UnifiedScoringFormState>(initialFormState);
  const [zodErrors, setZodErrors] = useState<ZodFormattedError<ValidatedUnifiedScoring, string> | null>(null);

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setFormValues(initialFormState);
      setZodErrors(null);
    }
  }, [open, initialFormState]);

  const handleFieldChange = useCallback((
    field: keyof UnifiedScoringFormState,
    value: number | string
  ) => {
    const processedValue = processNumericFieldInput(value);
    setFormValues(prev => ({ ...prev, [field]: processedValue }));
    setZodErrors(null);
  }, []);

  const handleSave = useCallback(async () => {
    const parsedValues = {
      subscribedBonusSetting: parseNumericInputAsZeroOrNumber(formValues.subscribedBonusSetting, defaultUnifiedScoring.subscribedBonusSetting),
      quicktakeBonus: parseNumericInputAsZeroOrNumber(formValues.quicktakeBonus, defaultUnifiedScoring.quicktakeBonus),
      timeDecayHalfLifeHours: parseNumericInputAsZeroOrNumber(formValues.timeDecayHalfLifeHours, defaultUnifiedScoring.timeDecayHalfLifeHours),
      postsMultiplier: parseNumericInputAsZeroOrNumber(formValues.postsMultiplier, defaultUnifiedScoring.postsMultiplier),
      threadsMultiplier: parseNumericInputAsZeroOrNumber(formValues.threadsMultiplier, defaultUnifiedScoring.threadsMultiplier),
    };

    const validationResult = unifiedScoringSchema.safeParse(parsedValues);

    if (!validationResult.success) {
      setZodErrors(validationResult.error.format());
      return;
    }

    updateSettings({
      resolverSettings: {
        ...settings.resolverSettings,
        unifiedScoring: parsedValues,
      },
    });

    flash({ messageString: 'Scoring bonuses updated successfully' });
    onClose();
  }, [formValues, defaultUnifiedScoring, settings, updateSettings, flash, onClose]);

  const hasErrors = zodErrors !== null;

  const hasUnsavedChanges = useMemo(() => {
    return !isEqual(formValues, initialFormState);
  }, [formValues, initialFormState]);

  return (
    <LWDialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      className={className}
    >
      <DialogContent className={classes.dialogContent}>
        <UnifiedScoringSettings
          formValues={formValues}
          errors={zodErrors}
          onFieldChange={handleFieldChange}
          defaultOpen={true}
          className={classes.compactSettingGroup}
        />
      </DialogContent>
      <DialogActions disableActionSpacing>
        <div className={classes.actionsContent}>
          <div className={classes.unsavedChangesIndicator}>
            {hasUnsavedChanges && 'you have unsaved changes'}
          </div>
          <div className={classes.buttonGroup}>
            <button
              className={classNames(classes.button, classes.cancelButton)}
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              className={classNames(classes.button, classes.saveButton, {
                [classes.buttonDisabled]: hasErrors
              })}
              onClick={handleSave}
              disabled={hasErrors}
            >
              Save
            </button>
          </div>
        </div>
      </DialogActions>
    </LWDialog>
  );
};

export default AlterBonusesDialog;

