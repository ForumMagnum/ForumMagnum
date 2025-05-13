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
  ThreadInterestModelFormState,
  CommentScoringFormState,
  DisplaySettingsFormState
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
import mergeWith from 'lodash/mergeWith';
import cloneDeep from 'lodash/cloneDeep';

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
    width: 100,
    cursor: 'pointer',
    border: '1px solid transparent',
    backgroundColor: 'transparent',
  },
  viewModeButtonInactive: {
    color: theme.palette.grey[900],
    backgroundColor: theme.palette.grey[250],
    fontWeight: 500,
    '&:hover': {
      backgroundColor: theme.palette.grey[300],
    },
  },
  viewModeButtonActive: {
    backgroundColor: theme.palette.background.paper,
    color: theme.palette.text.primary,
    opacity: 1,
    fontWeight: 600,
  },
  buttonRow: {
    display: 'flex',
    justifyContent: 'flex-end',
    marginTop: 12,
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
    backgroundColor: theme.palette.grey[250],
    fontWeight: 500,
    '&:hover': {
      backgroundColor: theme.palette.grey[300],
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
  settingsGroupsContainer: {
    width: "100%",
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: "6px",
    [theme.breakpoints.down('sm')]: {
      gap: "4px",
    },
  },
}));

const parseNumericInputAsZeroOrNumber = (
  value: string | number | '',
  defaultValueOnNaN: number 
): number => {
  if (value === '') {
    return 0; 
  }
  const num = Number(value);
  return isNaN(num) ? defaultValueOnNaN : num;
};

const customNullishCoalesceProperties = (objValue: any, srcValue: any): any => {
  return srcValue ?? objValue;
};

const deriveFormValuesFromSettings = (settings: UltraFeedSettingsType): SettingsFormState => {
  const { displaySettings: defaultDisplaySettings, resolverSettings: defaultResolverSettings } = DEFAULT_SETTINGS;
  const { commentScoring: defaultCommentScoring, threadInterestModel: defaultThreadInterestModel } = defaultResolverSettings;

  const { displaySettings, resolverSettings } = settings;

  return {
    sourceWeights: mergeWith(
      cloneDeep(DEFAULT_SOURCE_WEIGHTS),
      resolverSettings.sourceWeights,
      customNullishCoalesceProperties
    ),
    incognitoMode: resolverSettings.incognitoMode ?? defaultResolverSettings.incognitoMode,
    displaySetting: {
      lineClampNumberOfLines: displaySettings.lineClampNumberOfLines ?? defaultDisplaySettings.lineClampNumberOfLines,
      postTruncationBreakpoints: [...(displaySettings.postTruncationBreakpoints || [])],
      commentTruncationBreakpoints: [...(displaySettings.commentTruncationBreakpoints || [])],
      postTitlesAreModals: displaySettings.postTitlesAreModals ?? defaultDisplaySettings.postTitlesAreModals,
    },
    commentScoring: mergeWith(
      cloneDeep(defaultCommentScoring),
      resolverSettings.commentScoring,
      customNullishCoalesceProperties
    ),
    threadInterestModel: mergeWith(
      cloneDeep(defaultThreadInterestModel),
      resolverSettings.threadInterestModel,
      customNullishCoalesceProperties
    ),
  };
};

const deriveSimpleViewTruncationLevelsFromSettings = (settings: UltraFeedSettingsType) => ({
  commentLevel0: getFirstCommentLevel(settings.displaySettings.lineClampNumberOfLines, settings.displaySettings.commentTruncationBreakpoints?.[0]),
  commentLevel1: getCommentBreakpointLevel(settings.displaySettings.commentTruncationBreakpoints?.[1]),
  commentLevel2: getCommentBreakpointLevel(settings.displaySettings.commentTruncationBreakpoints?.[2]),
  postLevel0: getPostBreakpointLevel(settings.displaySettings.postTruncationBreakpoints?.[0]),
  postLevel1: getPostBreakpointLevel(settings.displaySettings.postTruncationBreakpoints?.[1]),
  postLevel2: getPostBreakpointLevel(settings.displaySettings.postTruncationBreakpoints?.[2]) ?? 'Unset',
});


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

  const { SourceWeightsSettings, TruncationGridSettings, AdvancedTruncationSettings, MultipliersSettings, MiscSettings, ThreadInterestTuningSettings, ExploreExploitBiasSettings } = Components; 

  const { flash } = useMessages();

  const { ultraFeedSettingsViewMode, setUltraFeedSettingsViewMode } = useLocalStorageState('ultraFeedSettingsViewMode', (key) => key, initialViewMode);
  const viewMode = ultraFeedSettingsViewMode && ['simple', 'advanced'].includes(ultraFeedSettingsViewMode) ? ultraFeedSettingsViewMode : initialViewMode;
  const setViewMode = (mode: 'simple' | 'advanced') => setUltraFeedSettingsViewMode(mode);

  const [simpleViewTruncationLevels, setSimpleViewTruncationLevels] = useState(() => 
    deriveSimpleViewTruncationLevelsFromSettings(settings)
  );

  const [formValues, setFormValues] = useState<SettingsFormState>(() => 
    deriveFormValuesFromSettings(settings)
  );

  const [zodErrors, setZodErrors] = useState<UltraFeedSettingsZodErrors>(null);

  const sourceWeightErrors: Record<FeedItemSourceType, string | undefined> = React.useMemo(() => {
    const errors = zodErrors as ZodFormattedError<ValidatedUltraFeedSettings, string>;
    return Object.keys(DEFAULT_SOURCE_WEIGHTS).reduce((acc, key) => {
      acc[key as FeedItemSourceType] = errors?.resolverSettings?.sourceWeights?.[key as FeedItemSourceType]?._errors[0];
      return acc;
    }, {} as Record<FeedItemSourceType, string | undefined>);
  }, [zodErrors]);

  useEffect(() => {
    setFormValues(deriveFormValuesFromSettings(settings));
    setSimpleViewTruncationLevels(deriveSimpleViewTruncationLevelsFromSettings(settings));
  }, [settings]);

  const updateForm = useCallback(<K extends keyof SettingsFormState>(
    key: K,
    value: SettingsFormState[K] | ((prev: SettingsFormState[K]) => SettingsFormState[K])
  ) => {
    setZodErrors(null);
    setFormValues(prev => {
      const newValue = typeof value === 'function' ? (value as any)(prev[key]) : value;
      return { ...prev, [key]: newValue };
    });
  }, []);
  
  const updateDisplaySettingForm = useCallback(<K extends keyof DisplaySettingsFormState>(
    key: K,
    value: DisplaySettingsFormState[K] | ((prev: DisplaySettingsFormState[K]) => DisplaySettingsFormState[K])
  ) => {
    setZodErrors(null);
    setFormValues(prev => ({
      ...prev,
      displaySetting: {
        ...prev.displaySetting,
        [key]: typeof value === 'function' ? (value as any)(prev.displaySetting[key]) : value,
      }
    }));
  }, []);

  const handleSourceWeightChange = useCallback((key: FeedItemSourceType, value: number | string) => {
    let numValue: number | '' = '';
    const strValue = String(value).trim();
    if (strValue === '') {
      numValue = '';
    } else {
      const parsedValue = parseInt(strValue, 10);
      // Keep storing integers or '' in form state. Saving logic will handle final conversion.
      numValue = (!isNaN(parsedValue) && Number.isInteger(Number(strValue))) ? parsedValue : '';
    }
    updateForm('sourceWeights', prev => ({ ...prev, [key]: numValue }));
  }, [updateForm]);

  const handleSimpleTruncationLevelChange = useCallback((
    field: keyof typeof simpleViewTruncationLevels,
    value: TruncationLevel
  ) => {
    setZodErrors(null);
    setSimpleViewTruncationLevels(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleBooleanChange = useCallback((
    field: 'incognitoMode' | 'postTitlesAreModals',
    checked: boolean
  ) => {
    setZodErrors(null);
    if (field === 'incognitoMode') {
      updateForm(field, checked);
    } else if (field === 'postTitlesAreModals') {
      updateDisplaySettingForm(field, checked);
    }
  }, [updateForm, updateDisplaySettingForm]);

  const handleLineClampChange = useCallback((value: number | string) => {
    const strValue = String(value).trim();
    if (strValue === '') {
      updateDisplaySettingForm('lineClampNumberOfLines', '');
    } else {
      const numValue = parseInt(strValue, 10);
      updateDisplaySettingForm('lineClampNumberOfLines', isNaN(numValue) ? '' : numValue);
    }
  }, [updateDisplaySettingForm]);

  const handleBreakpointChange = useCallback((
    kind: 'post' | 'comment',
    index: number,
    value: string | number
  ) => {
    const field = kind === 'post' ? 'postTruncationBreakpoints' : 'commentTruncationBreakpoints';
    updateDisplaySettingForm(field, (prev: (number | '')[]) => {
      const currentArray = [...prev];
      if (value === '') {
        currentArray[index] = '';
      } else if (typeof value === 'string') {
        const parsed = parseInt(value, 10);
        currentArray[index] = isNaN(parsed) ? '' : parsed;
      } else {
        currentArray[index] = value;
      }
      while (currentArray.length < 3) {
        currentArray.push('');
      }
      return currentArray.slice(0, 3);
    });
  }, [updateDisplaySettingForm]);

  const handleCommentScoringFieldChange = useCallback((
    field: keyof CommentScoringFormState, 
    value: number | string 
  ) => {
    let processedValue: string | number = value;

    if (field === 'threadScoreAggregation') {
      processedValue = value as string; 
    } else {
      const strValue = String(value).trim();
      if (strValue === '') {
        processedValue = '';
      } else {
        const num = parseFloat(strValue);
        processedValue = isNaN(num) ? '' : num; 
      }
    }
    updateForm('commentScoring', prevModel => ({ ...prevModel, [field]: processedValue }));
  }, [updateForm]);

  const handleThreadInterestFieldChange = useCallback((field: keyof ThreadInterestModelFormState, value: number | string) => {
    const strValue = String(value).trim();
    const processedValue = strValue === '' ? '' : (isNaN(parseFloat(strValue)) ? '' : parseFloat(strValue));
    updateForm('threadInterestModel', prevModel => ({ ...prevModel, [field]: processedValue, }));
  }, [updateForm]);

  const handleExploreBiasChange = useCallback((newExploreBiasValue: number) => {
    setZodErrors(null); 
    const newLogImpactFactor = 2 - newExploreBiasValue;
    const newCommentSubscribedAuthorMultiplier = (2 - newExploreBiasValue) * 2.5;

    const totalSourceWeight = Object.values(formValues.sourceWeights).reduce((acc: number, value: number | '') => acc + (value === '' ? 0 : value), 0) || 0;
    const newSubscribedAuthorSourceWeight = Math.max(1, Math.min(totalSourceWeight * ((0.05 + ((2-newExploreBiasValue) / 2)) * 0.25), totalSourceWeight));

    setFormValues(prev => ({
      ...prev,
      threadInterestModel: {
        ...prev.threadInterestModel,
        logImpactFactor: newLogImpactFactor,
      },
      commentScoring: {
        ...prev.commentScoring,
        commentSubscribedAuthorMultiplier: newCommentSubscribedAuthorMultiplier,
      },
      sourceWeights: {
        ...prev.sourceWeights,
        subscriptions: Math.round(newSubscribedAuthorSourceWeight),
      }
      
    }));
  }, [setFormValues, formValues.sourceWeights]);

  const handleSave = useCallback(() => {
    const defaultResolverSettings = DEFAULT_SETTINGS.resolverSettings;
    const defaultThreadInterestModel = defaultResolverSettings.threadInterestModel;
    const defaultCommentScoring = defaultResolverSettings.commentScoring;

    const settingsToUpdate: Partial<UltraFeedSettingsType> = {
      resolverSettings: {
        sourceWeights: mergeWith(
          cloneDeep(DEFAULT_SOURCE_WEIGHTS), 
          formValues.sourceWeights,
          (defaultWeightVal, formWeightVal) => parseNumericInputAsZeroOrNumber(formWeightVal, 0)
        ),
        incognitoMode: formValues.incognitoMode,
        commentScoring: mergeWith(
          cloneDeep(defaultCommentScoring),
          formValues.commentScoring,
          (defaultVal, formVal, key) => {
            if (key === 'threadScoreAggregation') {
              return formVal || defaultVal; // Handles empty string, null, undefined from formVal
            }
            return parseNumericInputAsZeroOrNumber(formVal, defaultVal);
          }
        ),
        threadInterestModel: mergeWith(
          cloneDeep(defaultThreadInterestModel),
          formValues.threadInterestModel,
          (defaultVal, formVal) => parseNumericInputAsZeroOrNumber(formVal, defaultVal)
        ),
      },
      displaySettings: {
        postTitlesAreModals: formValues.displaySetting.postTitlesAreModals,
        lineClampNumberOfLines: 0, // Placeholder, will be set below
        postTruncationBreakpoints: [], // Placeholder, will be set below
        commentTruncationBreakpoints: [], // Placeholder, will be set below
      }
    };
    
    if (viewMode === 'simple') {
      settingsToUpdate.displaySettings!.lineClampNumberOfLines = levelToCommentLinesMap[simpleViewTruncationLevels.commentLevel0];

      const commentLevels = [simpleViewTruncationLevels.commentLevel0, simpleViewTruncationLevels.commentLevel1, simpleViewTruncationLevels.commentLevel2];
      settingsToUpdate.displaySettings!.commentTruncationBreakpoints = commentLevels
        .map(lvl => levelToCommentBreakpointMap[lvl])
        .filter(bp => bp !== undefined)

      const postLevels = [simpleViewTruncationLevels.postLevel0, simpleViewTruncationLevels.postLevel1, simpleViewTruncationLevels.postLevel2];
      settingsToUpdate.displaySettings!.postTruncationBreakpoints = postLevels
        .map(lvl => levelToPostBreakpointMap[lvl])
        .filter(bp => bp !== undefined)
      
    } else {
      settingsToUpdate.displaySettings!.lineClampNumberOfLines = parseNumericInputAsZeroOrNumber(
        formValues.displaySetting.lineClampNumberOfLines,
        0 
      );
          
      settingsToUpdate.displaySettings!.postTruncationBreakpoints = formValues.displaySetting.postTruncationBreakpoints
        .map(val => {
          if (val === '') return undefined;
          const num = Number(val);
          if (isNaN(num)) return undefined;
          return num; 
        })
        .filter(bp => bp !== undefined) 
      
      settingsToUpdate.displaySettings!.commentTruncationBreakpoints = formValues.displaySetting.commentTruncationBreakpoints
        .map(val => {
          if (val === '') return undefined;
          const num = Number(val);
          if (isNaN(num)) return undefined;
          return num; 
        })
        .filter(bp => bp !== undefined) 
    }

    const result = ultraFeedSettingsSchema.safeParse(settingsToUpdate);

    if (!result.success) {
      const formattedErrors = result.error.format() as UltraFeedSettingsZodErrors;
      setZodErrors(formattedErrors);
      // eslint-disable-next-line no-console
      console.error("UltraFeed Settings Validation Errors:", formattedErrors);
      return;
    } 
    
    setZodErrors(null);
    
    updateSettings(result.data as Partial<UltraFeedSettingsType>);
    flash("Settings saved");
    captureEvent("ultraFeedSettingsUpdated", {
      oldSettings: settings,
      newSettings: result.data
    });

  }, [formValues, simpleViewTruncationLevels, updateSettings, captureEvent, settings, viewMode, flash]);
  
  const handleReset = useCallback(() => {
    resetSettingsToDefault();
    setZodErrors(null); 
  }, [resetSettingsToDefault]);

  const truncationGridProps = {
    levels: simpleViewTruncationLevels,
    onChange: handleSimpleTruncationLevelChange,
    originalSettings: settings,
    postBreakpointError: zodErrors?.displaySettings?.postTruncationBreakpoints?._errors?.[0],
    commentBreakpointError: zodErrors?.displaySettings?.commentTruncationBreakpoints?._errors?.[0],
  };
  
  const advancedTruncationProps = {
    values: formValues.displaySetting,
    errors: {
      lineClampNumberOfLines: zodErrors?.displaySettings?.lineClampNumberOfLines?._errors?.[0],
      postTruncationBreakpoints: zodErrors?.displaySettings?.postTruncationBreakpoints,
      commentTruncationBreakpoints: zodErrors?.displaySettings?.commentTruncationBreakpoints,
    },
    onLineClampChange: handleLineClampChange,
    onBreakpointChange: handleBreakpointChange,
  };
  
  const miscSettingsProps = {
    formValues: {
      incognitoMode: formValues.incognitoMode,
      postTitlesAreModals: formValues.displaySetting.postTitlesAreModals,
    },
    onBooleanChange: handleBooleanChange,

  };

  const exploreExploitBiasProps = {
    currentLogImpactFactor: formValues.threadInterestModel.logImpactFactor,
    onExploreBiasChange: handleExploreBiasChange,
  };

  const renderSimpleView = () => (
    <>
      <ExploreExploitBiasSettings {...exploreExploitBiasProps} />
      <SourceWeightsSettings
        weights={formValues.sourceWeights}
        errors={sourceWeightErrors}
        onChange={handleSourceWeightChange}
      />
      <TruncationGridSettings {...truncationGridProps} defaultOpen={true} />
      <MiscSettings {...miscSettingsProps} defaultOpen={false} />
    </>
  );

  const renderAdvancedView = () => (
    <>
      <SourceWeightsSettings
        weights={formValues.sourceWeights}
        errors={sourceWeightErrors}
        onChange={handleSourceWeightChange}
      />
      <AdvancedTruncationSettings {...advancedTruncationProps} />
      <MultipliersSettings
        formValues={formValues.commentScoring}
        errors={zodErrors ? (zodErrors as any).resolverSettings?.commentScoring : null}
        onFieldChange={handleCommentScoringFieldChange}
        defaultOpen={false}
      />
      <ThreadInterestTuningSettings
        formValues={formValues.threadInterestModel}
        errors={zodErrors ? (zodErrors as any).resolverSettings?.threadInterestModel : null}
        onFieldChange={handleThreadInterestFieldChange}
        defaultOpen={false}
      />
      <MiscSettings {...miscSettingsProps} />
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
      
      <div className={classes.settingsGroupsContainer}>
        {viewMode === 'simple' ? renderSimpleView() : renderAdvancedView()}
      </div>

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
