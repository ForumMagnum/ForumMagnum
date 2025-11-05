import React, { useState, useCallback, useMemo } from 'react';
import { defineStyles, useStyles } from '../hooks/useStyles';
import LWDialog from '../common/LWDialog';
import { DialogTitle } from '../widgets/DialogTitle';
import { DialogContent } from '../widgets/DialogContent';
import { DialogActions } from '../widgets/DialogActions';
import { UnifiedScoringSettings } from './settingsComponents/UltraFeedSettingsComponents';
import { UnifiedScoringFormState, DEFAULT_SETTINGS } from './ultraFeedSettingsTypes';
import { ValidatedUnifiedScoring, unifiedScoringSchema } from './ultraFeedSettingsValidation';
import { ZodFormattedError } from 'zod';
import { useMessages } from '../common/withMessages';
import { useUltraFeedSettings } from '../hooks/useUltraFeedSettings';
import classNames from 'classnames';
import mergeWith from 'lodash/mergeWith';
import cloneDeep from 'lodash/cloneDeep';

const styles = defineStyles('AlterBonusesDialog', (theme: ThemeType) => ({
  dialogContent: {
    minWidth: 500,
    [theme.breakpoints.down('sm')]: {
      minWidth: 'auto',
    },
  },
  compactSettingGroup: {
    backgroundColor: theme.palette.background.paper,
    width: '100%',
    padding: 16,
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
}));

const parseNumericInputAsZeroOrNumber = (
  value: string | number | '',
  defaultValueOnNaN: number 
): number => {
  if (value === '') return defaultValueOnNaN;
  if (typeof value === 'number') return value;
  const parsed = parseFloat(value);
  return isNaN(parsed) ? defaultValueOnNaN : parsed;
};

const AlterBonusesDialog = ({ open, onClose, className }: { open: boolean; onClose: () => void; className?: string }) => {
  const classes = useStyles(styles);
  const { settings, updateSettings } = useUltraFeedSettings();
  const { flash } = useMessages();

  const defaultUnifiedScoring = DEFAULT_SETTINGS.resolverSettings.unifiedScoring;

  const initialFormState: UnifiedScoringFormState = useMemo(() => {
    const customNullishCoalesceProperties = (objValue: any, srcValue: any): any => {
      return srcValue ?? objValue;
    };

    return mergeWith(
      cloneDeep(defaultUnifiedScoring),
      settings?.resolverSettings?.unifiedScoring,
      customNullishCoalesceProperties
    );
  }, [settings, defaultUnifiedScoring]);

  const [formValues, setFormValues] = useState<UnifiedScoringFormState>(initialFormState);
  const [zodErrors, setZodErrors] = useState<ZodFormattedError<ValidatedUnifiedScoring, string> | null>(null);

  const handleFieldChange = useCallback((
    field: keyof UnifiedScoringFormState,
    value: number | string
  ) => {
    const strValue = String(value).trim();
    const processedValue = strValue === '' ? '' : (isNaN(parseFloat(strValue)) ? '' : parseFloat(strValue));
    setFormValues(prev => ({ ...prev, [field]: processedValue }));
    setZodErrors(null);
  }, []);

  const handleSave = useCallback(async () => {
    const parsedValues = {
      subscribedBonusSetting: parseNumericInputAsZeroOrNumber(formValues.subscribedBonusSetting, defaultUnifiedScoring.subscribedBonusSetting),
      quicktakeBonus: parseNumericInputAsZeroOrNumber(formValues.quicktakeBonus, defaultUnifiedScoring.quicktakeBonus),
      timeDecayStrength: parseNumericInputAsZeroOrNumber(formValues.timeDecayStrength, defaultUnifiedScoring.timeDecayStrength),
      postsStartingValue: parseNumericInputAsZeroOrNumber(formValues.postsStartingValue, defaultUnifiedScoring.postsStartingValue),
      threadsStartingValue: parseNumericInputAsZeroOrNumber(formValues.threadsStartingValue, defaultUnifiedScoring.threadsStartingValue),
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
      <DialogActions>
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
      </DialogActions>
    </LWDialog>
  );
};

export default AlterBonusesDialog;

