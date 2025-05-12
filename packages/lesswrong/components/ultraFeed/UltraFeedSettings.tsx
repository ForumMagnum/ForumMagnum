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
  CommentScoringSettings,
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

// Helper function to parse form numbers, falling back to a default
const parseFormNumber = (value: string | number | '', defaultValue: number): number => {
  if (value === '') return defaultValue;
  const num = Number(value);
  return isNaN(num) ? defaultValue : num;
};

// Helper function to derive formValues from settings
const deriveFormValuesFromSettings = (settings: UltraFeedSettingsType): SettingsFormState => {

  const { displaySettings: defaultDisplaySettings, resolverSettings: defaultResolverSettings } = DEFAULT_SETTINGS;
  const { commentScoring: defaultCommentScoring, threadInterestModel: defaultThreadInterestModel } = defaultResolverSettings;

  const { displaySettings, resolverSettings } = settings;
  const { commentScoring, threadInterestModel } = resolverSettings;

  return {
    sourceWeights: { ...DEFAULT_SOURCE_WEIGHTS, ...(resolverSettings.sourceWeights || {}) },
    incognitoMode: resolverSettings.incognitoMode,
    displaySetting: {
      lineClampNumberOfLines: displaySettings.lineClampNumberOfLines ?? defaultDisplaySettings.lineClampNumberOfLines,
      postBreakpoints: [...(displaySettings.postTruncationBreakpoints || [])],
      commentBreakpoints: [...(displaySettings.commentTruncationBreakpoints || [])],
      postTitlesAreModals: displaySettings.postTitlesAreModals ?? defaultDisplaySettings.postTitlesAreModals,
    },
    commentScoring: {
      ultraFeedSeenPenalty: commentScoring?.ultraFeedSeenPenalty ?? defaultCommentScoring.ultraFeedSeenPenalty,
      quickTakeBoost: commentScoring?.quickTakeBoost ?? defaultCommentScoring.quickTakeBoost,
      commentSubscribedAuthorMultiplier: commentScoring?.commentSubscribedAuthorMultiplier ?? defaultCommentScoring.commentSubscribedAuthorMultiplier,
      commentDecayFactor: commentScoring?.commentDecayFactor ?? defaultCommentScoring.commentDecayFactor,
      commentDecayBiasHours: commentScoring?.commentDecayBiasHours ?? defaultCommentScoring.commentDecayBiasHours,
      threadScoreAggregation: commentScoring?.threadScoreAggregation ?? defaultCommentScoring.threadScoreAggregation,
      threadScoreFirstN: commentScoring?.threadScoreFirstN ?? defaultCommentScoring.threadScoreFirstN,
    },
    threadInterestModel: {
      commentCoeff: threadInterestModel?.commentCoeff ?? defaultThreadInterestModel.commentCoeff,
      voteCoeff: threadInterestModel?.voteCoeff ?? defaultThreadInterestModel.voteCoeff,
      viewCoeff: threadInterestModel?.viewCoeff ?? defaultThreadInterestModel.viewCoeff,
      onReadPostFactor: threadInterestModel?.onReadPostFactor ?? defaultThreadInterestModel.onReadPostFactor,
      logImpactFactor: threadInterestModel?.logImpactFactor ?? defaultThreadInterestModel.logImpactFactor,
      minOverallMultiplier: threadInterestModel?.minOverallMultiplier ?? defaultThreadInterestModel.minOverallMultiplier,
      maxOverallMultiplier: threadInterestModel?.maxOverallMultiplier ?? defaultThreadInterestModel.maxOverallMultiplier,
    },
  };
};

// Helper function to derive simpleViewTruncationLevels from settings
const deriveSimpleViewTruncationLevelsFromSettings = (settings: UltraFeedSettingsType) => ({
  commentLevel0: getFirstCommentLevel(settings.displaySettings.lineClampNumberOfLines, settings.displaySettings.commentTruncationBreakpoints?.[0]),
  commentLevel1: getCommentBreakpointLevel(settings.displaySettings.commentTruncationBreakpoints?.[1]),
  commentLevel2: getCommentBreakpointLevel(settings.displaySettings.commentTruncationBreakpoints?.[2]),
  postLevel0: getPostBreakpointLevel(settings.displaySettings.postTruncationBreakpoints?.[0]),
  postLevel1: getPostBreakpointLevel(settings.displaySettings.postTruncationBreakpoints?.[1]),
  postLevel2: getPostBreakpointLevel(settings.displaySettings.postTruncationBreakpoints?.[2]) ?? 'Unset',
});

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
    value: string | number | null
  ) => {
    const field = kind === 'post' ? 'postBreakpoints' : 'commentBreakpoints';
    updateDisplaySettingForm(field, (prev: (number | null | '')[]) => {
      const currentArray = [...prev];
      if (value === '') {
        currentArray[index] = '';
      } else if (value === null) {
        currentArray[index] = null;
      } else if (typeof value === 'string') {
        const parsed = parseInt(value, 10);
        currentArray[index] = isNaN(parsed) ? '' : parsed;
      } else {
        currentArray[index] = value;
      }
      // Ensure array has 3 elements for the UI, padding with '' if needed
      while (currentArray.length < 3) {
        currentArray.push('');
      }
      return currentArray.slice(0, 3); // Max 3 breakpoints
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
        processedValue = DEFAULT_SETTINGS.resolverSettings.commentScoring[field as keyof CommentScoringSettings];
      } else {
        const num = parseFloat(strValue);
        processedValue = isNaN(num) ? DEFAULT_SETTINGS.resolverSettings.commentScoring[field as keyof CommentScoringSettings] : num;
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
    setZodErrors(null); // Clear any previous validation errors
    const newLogImpactFactor = 2 - newExploreBiasValue;
    const newCommentSubscribedAuthorMultiplier = (3 - newExploreBiasValue) * 2;

    const totalSourceWeight = Object.values(formValues.sourceWeights).reduce((acc: number, value: number | '') => acc + (value === '' ? 0 : value), 0) || 0;
    // if newExploreBiasValue is high, set subscribedAuthorSourceWeight 5% of totalSourceWeight or 1 if less than 1
    // if newExploreBiasValue is low, set subscribedAuthorSourceWeight 30% of totalSourceWeight or 1 if less than 1
    // interpolated over the 0 - 2 range of newExploreBiasValue
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

    const settingsToUpdate: Partial<UltraFeedSettingsType> = {
      resolverSettings: {
        sourceWeights: Object.entries(formValues.sourceWeights)
          .reduce((acc, [key, value]) => {
            acc[key as FeedItemSourceType] = value === '' ? 0 : Number(value);
            return acc;
          }, {} as Record<FeedItemSourceType, number>),
        incognitoMode: formValues.incognitoMode,
        commentScoring: {
          commentDecayFactor: parseFormNumber(formValues.commentScoring.commentDecayFactor, defaultResolverSettings.commentScoring.commentDecayFactor),
          commentDecayBiasHours: parseFormNumber(formValues.commentScoring.commentDecayBiasHours, defaultResolverSettings.commentScoring.commentDecayBiasHours),
          threadScoreAggregation: formValues.commentScoring.threadScoreAggregation || defaultResolverSettings.commentScoring.threadScoreAggregation,
          threadScoreFirstN: parseFormNumber(formValues.commentScoring.threadScoreFirstN, defaultResolverSettings.commentScoring.threadScoreFirstN),
          ultraFeedSeenPenalty: parseFormNumber(formValues.commentScoring.ultraFeedSeenPenalty, defaultResolverSettings.commentScoring.ultraFeedSeenPenalty),
          quickTakeBoost: parseFormNumber(formValues.commentScoring.quickTakeBoost, defaultResolverSettings.commentScoring.quickTakeBoost),
          commentSubscribedAuthorMultiplier: parseFormNumber(formValues.commentScoring.commentSubscribedAuthorMultiplier, defaultResolverSettings.commentScoring.commentSubscribedAuthorMultiplier),
        },
        threadInterestModel: {
          commentCoeff: parseFormNumber(formValues.threadInterestModel.commentCoeff, defaultThreadInterestModel.commentCoeff),
          voteCoeff: parseFormNumber(formValues.threadInterestModel.voteCoeff, defaultThreadInterestModel.voteCoeff),
          viewCoeff: parseFormNumber(formValues.threadInterestModel.viewCoeff, defaultThreadInterestModel.viewCoeff),
          onReadPostFactor: parseFormNumber(formValues.threadInterestModel.onReadPostFactor, defaultThreadInterestModel.onReadPostFactor),
          logImpactFactor: parseFormNumber(formValues.threadInterestModel.logImpactFactor, defaultThreadInterestModel.logImpactFactor),
          minOverallMultiplier: parseFormNumber(formValues.threadInterestModel.minOverallMultiplier, defaultThreadInterestModel.minOverallMultiplier),
          maxOverallMultiplier: parseFormNumber(formValues.threadInterestModel.maxOverallMultiplier, defaultThreadInterestModel.maxOverallMultiplier),
        },
      },
      displaySettings: {
        postTitlesAreModals: formValues.displaySetting.postTitlesAreModals,
        lineClampNumberOfLines: 0,
        postTruncationBreakpoints: [],
        commentTruncationBreakpoints: [],
      }
    };
    
    if (viewMode === 'simple') {
      settingsToUpdate.displaySettings!.lineClampNumberOfLines = levelToCommentLinesMap[simpleViewTruncationLevels.commentLevel0];

      const commentLevels = [simpleViewTruncationLevels.commentLevel0, simpleViewTruncationLevels.commentLevel1, simpleViewTruncationLevels.commentLevel2];
      let commentBreakpoints: (number | null)[] = commentLevels
        .map(lvl => levelToCommentBreakpointMap[lvl])
        .filter(bp => bp !== undefined) as (number | null)[];
      while (commentBreakpoints.length > 0 && commentBreakpoints[commentBreakpoints.length -1] === null) commentBreakpoints.pop();
      settingsToUpdate.displaySettings!.commentTruncationBreakpoints = commentBreakpoints;

      const postLevels = [simpleViewTruncationLevels.postLevel0, simpleViewTruncationLevels.postLevel1, simpleViewTruncationLevels.postLevel2];
      let postBreakpoints: (number | null)[] = postLevels
        .map(lvl => levelToPostBreakpointMap[lvl])
        .filter(bp => bp !== undefined) as (number | null)[];
       while (postBreakpoints.length > 0 && postBreakpoints[postBreakpoints.length -1] === null) postBreakpoints.pop();
      settingsToUpdate.displaySettings!.postTruncationBreakpoints = postBreakpoints;
      
    } else {
      settingsToUpdate.displaySettings!.lineClampNumberOfLines = formValues.displaySetting.lineClampNumberOfLines === '' || isNaN(Number(formValues.displaySetting.lineClampNumberOfLines))
          ? 0
          : Number(formValues.displaySetting.lineClampNumberOfLines);
          
      settingsToUpdate.displaySettings!.postTruncationBreakpoints = formValues.displaySetting.postBreakpoints
        .map(breakpoint => {
          if (breakpoint === '' || breakpoint === undefined) return undefined;
          if (breakpoint === null) return null;
          return Number(breakpoint);
        }).filter(bp => bp !== undefined) as (number | null)[];
      
      settingsToUpdate.displaySettings!.commentTruncationBreakpoints = formValues.displaySetting.commentBreakpoints
        .map(breakpoint => {
          if (breakpoint === '' || breakpoint === undefined) return undefined;
          if (breakpoint === null) return null;
          return Number(breakpoint);
        }).filter(bp => bp !== undefined) as (number | null)[];
    }

    const result = ultraFeedSettingsSchema.safeParse(settingsToUpdate);

    if (!result.success) {
      const formattedErrors = result.error.format() as UltraFeedSettingsZodErrors;
      setZodErrors(formattedErrors);
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

  // Prepare props for TruncationGridSettings
  const truncationGridProps = {
    levels: simpleViewTruncationLevels,
    onChange: handleSimpleTruncationLevelChange,
    originalSettings: settings,
  };
  
  // Prepare props for AdvancedTruncationSettings
  const advancedTruncationProps = {
    values: formValues.displaySetting,
    errors: {
      lineClampNumberOfLines: (zodErrors as any)?.displaySettings?.lineClampNumberOfLines?._errors[0],
      postBreakpoints: (zodErrors as any)?.displaySettings?.postTruncationBreakpoints,
      commentBreakpoints: (zodErrors as any)?.displaySettings?.commentTruncationBreakpoints,
    },
    onLineClampChange: handleLineClampChange,
    onBreakpointChange: handleBreakpointChange,
  };
  
  // Props for MiscSettings
  const miscSettingsProps = {
    formValues: {
      incognitoMode: formValues.incognitoMode,
      postTitlesAreModals: formValues.displaySetting.postTitlesAreModals,
    },
    onBooleanChange: handleBooleanChange,

  };

  // Prepare props for ExploreExploitBiasSettings
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
