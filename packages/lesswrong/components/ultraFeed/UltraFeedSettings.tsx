import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib/components';
import { 
  UltraFeedSettingsType, 
  DEFAULT_SOURCE_WEIGHTS, 
  DEFAULT_SETTINGS,
  TruncationLevel,
  levelToCommentLinesMap,
  levelToCommentBreakpointMap,
  levelToPostBreakpointMap,
  getCommentBreakpointLevel,
  getFirstCommentLevel,
  getPostBreakpointLevel,
  SettingsFormState,
  TruncationGridFields,
} from './ultraFeedSettingsTypes';
import { FeedItemSourceType } from './ultraFeedTypes';
import { defineStyles, useStyles } from '../hooks/useStyles';
import classNames from 'classnames';
import { useTracking } from '@/lib/analyticsEvents';
import { useMessages } from '../common/withMessages';
import { useLocalStorageState } from '../hooks/useLocalStorageState';
import { 
  ultraFeedSettingsSchema, 
  UltraFeedSettingsZodErrors,
  ValidatedUltraFeedSettings
} from './ultraFeedSettingsValidation';
import { ZodFormattedError } from 'zod';

const styles = defineStyles('UltraFeedSettings', (theme: ThemeType) => ({
  root: {
    width: '100%',
    fontFamily: theme.palette.fonts.sansSerifStack,
  },
  viewModeToggle: {
    display: 'flex',
    columnGap: 8,
    justifyContent: 'center',
    marginBottom: 12,
  },
  viewModeButton: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    fontFamily: theme.typography.fontFamily,
    fontSize: 14,
    lineHeight: '23px',
    fontWeight: 500,
    padding: '4px 8px',
    borderRadius: 4,
    width: 80,
    cursor: 'pointer',
    border: '1px solid transparent',
    backgroundColor: 'transparent',
  },
  viewModeButtonInactive: {
    backgroundColor: theme.palette.grey[200],
    color: theme.palette.text.secondary,
    opacity: 0.7,
    '&:hover': {
      opacity: 0.9,
    },
  },
  viewModeButtonActive: {
    backgroundColor: theme.palette.background.paper,
    color: theme.palette.text.primary,
    borderColor: theme.palette.grey[400],
    opacity: 1,
    fontWeight: 600,
  },
  buttonRow: {
    display: 'flex',
    justifyContent: 'flex-end',
    marginTop: theme.spacing.unit * 3,
  },
  button: {
    minWidth: 100,
    padding: '8px 16px',
    border: 'none',
    borderRadius: 4,
    cursor: 'pointer',
    fontFamily: 'inherit',
    fontSize: 14,
    fontWeight: 500,
    '&:hover': {
      backgroundColor: theme.palette.primary.dark,
    },
    '&:not(:last-child)': {
      marginRight: theme.spacing.unit * 1.5,
    },
  },
  saveButton: {
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.primary.contrastText,
    fontWeight: 600,
  },
  resetButton: {
    color: theme.palette.grey[900],
    '&:hover': {
      backgroundColor: theme.palette.grey[500],
    },
  },
  buttonDisabled: {
    backgroundColor: theme.palette.grey[300],
    color: theme.palette.grey[600],
    cursor: 'not-allowed',
    '&:hover': {
      backgroundColor: theme.palette.grey[300],
    },
  },
}));

const UltraFeedSettings = ({
  settings,
  updateSettings,
  resetSettingsToDefault,
  onClose,
  initialViewMode = 'simple'
}: {
  settings: UltraFeedSettingsType,
  updateSettings: (newSettings: Partial<UltraFeedSettingsType>) => void,
  resetSettingsToDefault: () => void,
  onClose?: () => void,
  initialViewMode?: 'simple' | 'advanced'
}) => {
  const { captureEvent } = useTracking();
  const classes = useStyles(styles);

  const { SourceWeightsSettings, TruncationGridSettings, AdvancedTruncationSettings, MultipliersSettings, MiscSettings } = Components; 

  const { flash } = useMessages();

  const { ultraFeedSettingsViewMode, setUltraFeedSettingsViewMode } = useLocalStorageState('ultraFeedSettingsViewMode', (key) => key, initialViewMode);
  const viewMode = ultraFeedSettingsViewMode && ['simple', 'advanced'].includes(ultraFeedSettingsViewMode) ? ultraFeedSettingsViewMode : initialViewMode;
  const setViewMode = (mode: 'simple' | 'advanced') => setUltraFeedSettingsViewMode(mode);

  const [formValues, setFormValues] = useState<SettingsFormState>(() => ({
    sourceWeights: { ...DEFAULT_SOURCE_WEIGHTS, ...(settings.sourceWeights || {}) },
    commentLevel0: getFirstCommentLevel(settings.lineClampNumberOfLines, settings.commentTruncationBreakpoints?.[0]),
    commentLevel1: getCommentBreakpointLevel(settings.commentTruncationBreakpoints?.[1]),
    commentLevel2: getCommentBreakpointLevel(settings.commentTruncationBreakpoints?.[2]),
    postLevel0: getPostBreakpointLevel(settings.postTruncationBreakpoints?.[0]),
    postLevel1: getPostBreakpointLevel(settings.postTruncationBreakpoints?.[1]),
    postLevel2: getPostBreakpointLevel(settings.postTruncationBreakpoints?.[2]),
    incognitoMode: settings.incognitoMode,
    quickTakeBoost: settings.quickTakeBoost ?? DEFAULT_SETTINGS.quickTakeBoost,

    lineClampNumberOfLines: settings.lineClampNumberOfLines ?? DEFAULT_SETTINGS.lineClampNumberOfLines,
    postBreakpoints: [...(settings.postTruncationBreakpoints || [])],
    commentBreakpoints: [...(settings.commentTruncationBreakpoints || [])],
    ultraFeedSeenPenalty: settings.ultraFeedSeenPenalty ?? DEFAULT_SETTINGS.ultraFeedSeenPenalty,
    postTitlesAreModals: settings.postTitlesAreModals ?? DEFAULT_SETTINGS.postTitlesAreModals,
  }));

  const [zodErrors, setZodErrors] = useState<UltraFeedSettingsZodErrors>(null);

  const getSourceWeightError = useCallback(
    (k: FeedItemSourceType): string | undefined =>
      zodErrors?.sourceWeights?.[k]?._errors[0],
    [zodErrors]
  );

  const getScalarError = useCallback(<K extends keyof ValidatedUltraFeedSettings>(k: K): string | undefined =>
    zodErrors?.[k]?._errors[0], [zodErrors]);

  const getArrayError = useCallback(
    (k: 'postTruncationBreakpoints' | 'commentTruncationBreakpoints'): ZodFormattedError<(number | null)[]> | undefined =>
      zodErrors?.[k],
    [zodErrors]
  );

  const sourceWeightErrors: Record<FeedItemSourceType, string | undefined> = React.useMemo(() => {
    return Object.keys(DEFAULT_SOURCE_WEIGHTS).reduce((acc, key) => {
      acc[key as FeedItemSourceType] = getSourceWeightError(key as FeedItemSourceType);
      return acc;
    }, {} as Record<FeedItemSourceType, string | undefined>);
  }, [getSourceWeightError]);

  useEffect(() => {
    const derivedCommentLevel0 = getFirstCommentLevel(settings.lineClampNumberOfLines, settings.commentTruncationBreakpoints?.[0]);
    const derivedCommentLevel1 = getCommentBreakpointLevel(settings.commentTruncationBreakpoints?.[1]) || 'Long';
    const derivedCommentLevel2 = getCommentBreakpointLevel(settings.commentTruncationBreakpoints?.[2]) || 'Long';
    const derivedPostLevel0 = getPostBreakpointLevel(settings.postTruncationBreakpoints?.[0]);
    const derivedPostLevel1 = getPostBreakpointLevel(settings.postTruncationBreakpoints?.[1]);
    const derivedPostLevel2 = getPostBreakpointLevel(settings.postTruncationBreakpoints?.[2]) || 'Unset';

    setFormValues(currentValues => ({
      ...currentValues,
      sourceWeights: { ...DEFAULT_SOURCE_WEIGHTS, ...(settings.sourceWeights || {}) },
      commentLevel0: derivedCommentLevel0,
      commentLevel1: derivedCommentLevel1,
      commentLevel2: derivedCommentLevel2,
      postLevel0: derivedPostLevel0,
      postLevel1: derivedPostLevel1,
      postLevel2: derivedPostLevel2,
      incognitoMode: settings.incognitoMode,
      quickTakeBoost: settings.quickTakeBoost ?? DEFAULT_SETTINGS.quickTakeBoost,
      // Advanced
      lineClampNumberOfLines: settings.lineClampNumberOfLines ?? DEFAULT_SETTINGS.lineClampNumberOfLines,
      postBreakpoints: [...(settings.postTruncationBreakpoints || [])],
      commentBreakpoints: [...(settings.commentTruncationBreakpoints || [])],
      // Misc
      ultraFeedSeenPenalty: settings.ultraFeedSeenPenalty ?? DEFAULT_SETTINGS.ultraFeedSeenPenalty,
      postTitlesAreModals: settings.postTitlesAreModals ?? DEFAULT_SETTINGS.postTitlesAreModals,
    }));
  }, [
      settings.sourceWeights,
      settings.lineClampNumberOfLines,
      settings.commentTruncationBreakpoints,
      settings.postTruncationBreakpoints,
      settings.incognitoMode,
      settings.quickTakeBoost,
      settings.ultraFeedSeenPenalty,
      settings.postTitlesAreModals
     ]);

  const updateForm = useCallback(<K extends keyof SettingsFormState>(
    key: K,
    value: SettingsFormState[K] | ((prev: SettingsFormState[K]) => SettingsFormState[K])
  ) => {
    setZodErrors(null);

    setFormValues(prev => ({
      ...prev,
      [key]: typeof value === 'function' ? (value as any)(prev[key]) : value,
    }));
  }, []);

  const handleSourceWeightChange = useCallback((key: FeedItemSourceType, value: number | string) => {
    let numValue: number | '' = '';
    const strValue = String(value).trim();
    if (strValue === '') {
      numValue = '';
    } else {
      const parsedValue = parseInt(strValue, 10);
      numValue = (!isNaN(parsedValue) && Number.isInteger(Number(strValue))) ? parsedValue : '';
    }

    updateForm('sourceWeights', prev => ({
      ...prev,
      [key]: numValue,
    }));
  }, [updateForm]);

  const handleTruncationLevelChange = useCallback((
    field: TruncationGridFields,
    value: TruncationLevel
  ) => {
    updateForm(field, value);
  }, [updateForm]);

  const handleBooleanChange = useCallback((
    field: keyof SettingsFormState,
    checked: boolean
  ) => {
    updateForm(field, checked);
  }, [updateForm]);

  const handleQuickTakeBoostChange = useCallback((value: number | string) => {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    updateForm('quickTakeBoost', numValue);
  }, [updateForm]);

  const handleSeenPenaltyChange = useCallback((value: number | string) => {
    const strValue = String(value).trim();
    if (strValue === '') {
      updateForm('ultraFeedSeenPenalty', '');
    } else {
      const numValue = parseFloat(strValue);
      updateForm('ultraFeedSeenPenalty', numValue);
    }
  }, [updateForm]);
  
  const handleLineClampChange = useCallback((value: number | string) => {
    const strValue = String(value).trim();
    if (strValue === '') {
      updateForm('lineClampNumberOfLines', '');
    } else {
      const numValue = parseInt(strValue, 10);
      updateForm('lineClampNumberOfLines', isNaN(numValue) ? '' : numValue);
    }
  }, [updateForm]);

  const handleBreakpointChange = useCallback((
    kind: 'post' | 'comment',
    index: number,
    value: string | number | null
  ) => {
    const field = kind === 'post' ? 'postBreakpoints' : 'commentBreakpoints';
    
    updateForm(field, prev => {
      const currentArray = [...prev];
      if (value === '') {
        currentArray[index] = '';
      } 
      else if (value === null) {
        currentArray[index] = null;
      } 
      else if (typeof value === 'string') {
        const parsed = parseInt(value, 10);
        currentArray[index] = isNaN(parsed) ? '' : parsed;
      } 
      else {
        currentArray[index] = value;
      }
      return currentArray;
    });
  }, [updateForm]);


  const handleSave = useCallback(() => {
    const settingsToUpdate: Record<string, any> = {};

    settingsToUpdate.sourceWeights = Object.entries(formValues.sourceWeights)
      .reduce((acc, [key, value]) => {
        acc[key as FeedItemSourceType] = value === '' ? 0 : Number(value);
        return acc;
      }, {} as Record<FeedItemSourceType, number>);

    settingsToUpdate.quickTakeBoost = isNaN(formValues.quickTakeBoost) 
        ? DEFAULT_SETTINGS.quickTakeBoost 
        : formValues.quickTakeBoost;
        
    settingsToUpdate.ultraFeedSeenPenalty = formValues.ultraFeedSeenPenalty === '' || isNaN(Number(formValues.ultraFeedSeenPenalty))
        ? DEFAULT_SETTINGS.ultraFeedSeenPenalty
        : Number(formValues.ultraFeedSeenPenalty);

    settingsToUpdate.incognitoMode = formValues.incognitoMode;
    settingsToUpdate.postTitlesAreModals = formValues.postTitlesAreModals;

    if (viewMode === 'simple') {
      settingsToUpdate.lineClampNumberOfLines = levelToCommentLinesMap[formValues.commentLevel0];

      const commentLevels = [formValues.commentLevel0, formValues.commentLevel1, formValues.commentLevel2];
      let commentBreakpoints: (number | null)[] = commentLevels
        .map(lvl => levelToCommentBreakpointMap[lvl])        // (num|null|undef)[]
        .filter(bp => bp !== undefined) as (number | null)[];// drop undefined, keep null
      // trim trailing nulls
      while (commentBreakpoints.at(-1) === null) commentBreakpoints.pop();
      settingsToUpdate.commentTruncationBreakpoints = commentBreakpoints;

      const postLevels = [formValues.postLevel0, formValues.postLevel1, formValues.postLevel2];
      const postBreakpoints: (number | null)[] = postLevels
        .map(lvl => levelToPostBreakpointMap[lvl])
        .filter(bp => bp !== undefined) as (number | null)[];
      settingsToUpdate.postTruncationBreakpoints = postBreakpoints; 
      
    } else { 
      settingsToUpdate.lineClampNumberOfLines = formValues.lineClampNumberOfLines === '' || isNaN(Number(formValues.lineClampNumberOfLines))
          ? 0
          : Number(formValues.lineClampNumberOfLines);
          
      settingsToUpdate.postTruncationBreakpoints = formValues.postBreakpoints.map(breakpoint => {
        if (breakpoint === '' || isNaN(Number(breakpoint))) return undefined;
        return Number(breakpoint);
      });
      
      settingsToUpdate.commentTruncationBreakpoints = formValues.commentBreakpoints.map(breakpoint => {
        if (breakpoint === '' || isNaN(Number(breakpoint))) return undefined;
        return Number(breakpoint);
      });
    }

    const result = ultraFeedSettingsSchema.safeParse(settingsToUpdate);

    if (!result.success) {
      const formattedErrors = result.error.format();
      setZodErrors(formattedErrors);
      // eslint-disable-next-line no-console
      console.error("UltraFeed Settings Validation Errors:", formattedErrors);
      return;
    } 
    
    setZodErrors(null);
    
    updateSettings(result.data);
    flash("Settings saved");
    captureEvent("ultraFeedSettingsUpdated", {
      oldSettings: settings,
      newSettings: result.data
    });

  }, [formValues, updateSettings, captureEvent, settings, viewMode, flash]);
  
  const handleReset = useCallback(() => {
    resetSettingsToDefault();
    setZodErrors(null); 
  }, [resetSettingsToDefault]);


  const renderSimpleView = () => (
    <>
      <SourceWeightsSettings
        weights={formValues.sourceWeights}
        errors={sourceWeightErrors}
        onChange={handleSourceWeightChange}
      />
      <TruncationGridSettings
        levels={formValues}
        onChange={handleTruncationLevelChange}
        originalSettings={settings} 
      />
    </>
  );

  const renderAdvancedView = () => (
    <>
      <SourceWeightsSettings
        weights={formValues.sourceWeights}
        errors={sourceWeightErrors}
        onChange={handleSourceWeightChange}
      />
      <MultipliersSettings
        quickTakeBoost={{
          value: formValues.quickTakeBoost,
          error: getScalarError('quickTakeBoost'),
          onChange: handleQuickTakeBoostChange,
        }}
        seenPenalty={{
          value: formValues.ultraFeedSeenPenalty,
          error: getScalarError('ultraFeedSeenPenalty'),
          onChange: handleSeenPenaltyChange,
        }}
      />
      <AdvancedTruncationSettings
        onLineClampChange={handleLineClampChange}
        onBreakpointChange={handleBreakpointChange}
        values={{
          lineClampNumberOfLines: formValues.lineClampNumberOfLines,
          postBreakpoints: formValues.postBreakpoints,
          commentBreakpoints: formValues.commentBreakpoints,
        }}
        errors={{
          lineClampNumberOfLines: getScalarError('lineClampNumberOfLines'),
          postBreakpoints: getArrayError('postTruncationBreakpoints'),
          commentBreakpoints: getArrayError('commentTruncationBreakpoints'),
        }}
      />
      <MiscSettings
        formValues={formValues} 
        onBooleanChange={handleBooleanChange}
      />
    </>
  );

  const hasAnyErrors = useMemo(() => {
     return zodErrors !== null;
  }, [zodErrors]);

  return (
    <div className={classes.root}>
      <div className={classes.viewModeToggle}>
        <div
          onClick={() => setViewMode('simple')}
          className={classNames(classes.viewModeButton, viewMode === 'simple' ? classes.viewModeButtonActive : classes.viewModeButtonInactive)}
        >
           Simple
        </div>
        <div
          onClick={() => setViewMode('advanced')}
          className={classNames(classes.viewModeButton, viewMode === 'advanced' ? classes.viewModeButtonActive : classes.viewModeButtonInactive)}
        >
          Advanced
        </div>
      </div>
      
      {viewMode === 'simple' ? renderSimpleView() : renderAdvancedView()}

      <div className={classes.buttonRow}>
        <button
          className={classNames(classes.button, classes.resetButton)}
          onClick={handleReset}
        >
          Reset
        </button>
        <button
          className={classNames(classes.button, classes.saveButton, {
            [classes.buttonDisabled]: hasAnyErrors
          })}
          onClick={handleSave}
          disabled={hasAnyErrors}
        >
          Save
        </button>
      </div>
    </div>
  );
};

const UltraFeedSettingsComponent = registerComponent('UltraFeedSettings', UltraFeedSettings);

export default UltraFeedSettings;

declare global {
  interface ComponentTypes {
    UltraFeedSettings: typeof UltraFeedSettingsComponent
  }
} 
