import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { 
  UltraFeedSettingsType,
  DEFAULT_SOURCE_WEIGHTS, 
  DEFAULT_SETTINGS,
  TruncationLevel,
  getWordCountLevel,
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
  ValidatedUltraFeedSettings,
  ValidatedCommentScoring,
  ValidatedThreadInterestModel
} from './ultraFeedSettingsValidation';
import { ZodFormattedError } from 'zod';
import mergeWith from 'lodash/mergeWith';
import cloneDeep from 'lodash/cloneDeep';
import UltraFeedFeedback from './UltraFeedFeedback';
import FeedSelectorCheckbox from '../common/FeedSelectorCheckbox';
import {
  SourceWeightsSettings,
  TruncationGridSettings,
  AdvancedTruncationSettings,
  MultipliersSettings,
  MiscSettings,
  ExploreExploitBiasSettings,
  ThreadInterestTuningSettings,
  AdvancedTruncationSettingsProps,
  ExploreExploitBiasSettingsProps,
  TruncationGridSettingsProps,
  MiscSettingsProps
} from "./settingsComponents/UltraFeedSettingsComponents";

const styles = defineStyles('UltraFeedSettings', (theme: ThemeType) => ({
  root: {
    width: '100%',
    fontFamily: theme.palette.fonts.sansSerifStack,
    marginBottom: 16,
  },
  viewModeToggle: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: 12,
    alignItems: 'center',
    position: 'relative',
  },
  viewModeButtonsContainer: {
    display: 'flex',
    columnGap: 8,
    flex: '1 1 0',
    justifyContent: 'center',
  },
  spacer: {
    flex: '1 1 0',
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
  feedbackButtonContainer: {
    flex: '1 1 0',
    display: 'flex',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 8,
  },
  feedbackButton: {
    color: theme.palette.grey[600],
    cursor: 'pointer',
    fontSize: "1.2rem",
    fontStyle: 'italic',
    padding: '4px 8px',
    borderRadius: 4,
    fontFamily: theme.palette.fonts.sansSerifStack,
    '&:hover': {
      color: theme.palette.ultraFeed.dim,
      backgroundColor: theme.palette.panelBackground.hoverHighlightGrey,
    },
    [theme.breakpoints.down('sm')]: {
      fontSize: 12,
      marginRight: 4,
    },
  },
  feedbackButtonActive: {
    color: theme.palette.ultraFeed.dim,
    backgroundColor: theme.palette.panelBackground.hoverHighlightGrey,
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

// Helper components for Simple and Advanced views
interface SimpleViewProps {
  exploreExploitBiasProps: ExploreExploitBiasSettingsProps;
  sourceWeights: SettingsFormState['sourceWeights'];
  sourceWeightErrors: Record<FeedItemSourceType, string | undefined>;
  onSourceWeightChange: (key: FeedItemSourceType, value: number | string) => void;
  truncationGridProps: TruncationGridSettingsProps;
  miscSettingsProps: MiscSettingsProps;
}

const SimpleView: React.FC<SimpleViewProps> = ({
  exploreExploitBiasProps,
  sourceWeights,
  sourceWeightErrors,
  onSourceWeightChange,
  truncationGridProps,
  miscSettingsProps,
}) => (
  <>
    <ExploreExploitBiasSettings {...exploreExploitBiasProps} />
    <SourceWeightsSettings
      weights={sourceWeights}
      errors={sourceWeightErrors}
      onChange={onSourceWeightChange}
    />
    <TruncationGridSettings {...truncationGridProps} defaultOpen={true} />
    <MiscSettings {...miscSettingsProps} defaultOpen={false} />
  </>
);

interface AdvancedViewProps {
  sourceWeights: SettingsFormState['sourceWeights'];
  sourceWeightErrors: Record<FeedItemSourceType, string | undefined>;
  onSourceWeightChange: (key: FeedItemSourceType, value: number | string) => void;
  advancedTruncationProps: AdvancedTruncationSettingsProps;
  commentScoringFormValues: CommentScoringFormState;
  commentScoringErrors: ZodFormattedError<ValidatedCommentScoring, string> | null;
  onCommentScoringFieldChange: (field: keyof CommentScoringFormState, value: number | string) => void;
  threadInterestModelFormValues: ThreadInterestModelFormState;
  threadInterestModelErrors: ZodFormattedError<ValidatedThreadInterestModel, string> | null;
  onThreadInterestFieldChange: (field: keyof ThreadInterestModelFormState, value: number | string) => void;
  miscSettingsProps: MiscSettingsProps;
}

const AdvancedView: React.FC<AdvancedViewProps> = ({
  sourceWeights,
  sourceWeightErrors,
  onSourceWeightChange,
  advancedTruncationProps,
  commentScoringFormValues,
  commentScoringErrors,
  onCommentScoringFieldChange,
  threadInterestModelFormValues,
  threadInterestModelErrors,
  onThreadInterestFieldChange,
  miscSettingsProps,
}) => (
  <>
    <SourceWeightsSettings
      weights={sourceWeights}
      errors={sourceWeightErrors}
      onChange={onSourceWeightChange}
    />
    <AdvancedTruncationSettings {...advancedTruncationProps} />
    <MultipliersSettings
      formValues={commentScoringFormValues}
      errors={commentScoringErrors}
      onFieldChange={onCommentScoringFieldChange}
      defaultOpen={false}
    />
    <ThreadInterestTuningSettings
      formValues={threadInterestModelFormValues}
      errors={threadInterestModelErrors}
      onFieldChange={onThreadInterestFieldChange}
      defaultOpen={false}
    />
    <MiscSettings {...miscSettingsProps} />
  </>
);

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
      postInitialWords: displaySettings.postInitialWords ?? defaultDisplaySettings.postInitialWords,
      postMaxWords: displaySettings.postMaxWords ?? defaultDisplaySettings.postMaxWords,
      commentCollapsedInitialWords: displaySettings.commentCollapsedInitialWords ?? defaultDisplaySettings.commentCollapsedInitialWords,
      commentExpandedInitialWords: displaySettings.commentExpandedInitialWords ?? defaultDisplaySettings.commentExpandedInitialWords,
      commentMaxWords: displaySettings.commentMaxWords ?? defaultDisplaySettings.commentMaxWords,
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

const deriveSimpleViewTruncationLevelsFromSettings = (
  settings: UltraFeedSettingsType,
  maps: { commentMap: Record<TruncationLevel, number>, postMap: Record<TruncationLevel, number> }
) => ({
  commentCollapsedInitialLevel: getWordCountLevel(settings.displaySettings.commentCollapsedInitialWords, maps.commentMap),
  commentExpandedInitialLevel: getWordCountLevel(settings.displaySettings.commentExpandedInitialWords, maps.commentMap),
  commentMaxLevel: getWordCountLevel(settings.displaySettings.commentMaxWords, maps.commentMap),
  postInitialLevel: getWordCountLevel(settings.displaySettings.postInitialWords, maps.postMap),
  postMaxLevel: getWordCountLevel(settings.displaySettings.postMaxWords, maps.postMap),
});

const ViewModeButton: React.FC<{
  mode: 'simple' | 'advanced';
  currentViewMode: 'simple' | 'advanced';
  onClick: (mode: 'simple' | 'advanced') => void;
}> = ({
  mode,
  currentViewMode,
  onClick,
}) => {
  const classes = useStyles(styles);
  return (
    <div
      onClick={() => onClick(mode)}
      className={classNames(
      classes.viewModeButton,
      currentViewMode === mode
        ? classes.viewModeButtonActive
        : classes.viewModeButtonInactive
    )}
  >
      {mode.charAt(0).toUpperCase() + mode.slice(1)}
    </div>
  );
};

const UltraFeedSettings = ({
  settings,
  updateSettings,
  resetSettingsToDefault,
  onClose,
  initialViewMode = 'simple',
  truncationMaps,
  showFeedSelector = false,
}: {
  settings: UltraFeedSettingsType,
  updateSettings: (newSettings: Partial<UltraFeedSettingsType>) => void,
  resetSettingsToDefault: () => void,
  onClose?: () => void,
  initialViewMode?: 'simple' | 'advanced',
  truncationMaps: { commentMap: Record<TruncationLevel, number>, postMap: Record<TruncationLevel, number> },
  showFeedSelector?: boolean,
}) => {
  const { captureEvent } = useTracking();
  const classes = useStyles(styles);
  const { flash } = useMessages();
  const [showFeedback, setShowFeedback] = useState(false);


  const { ultraFeedSettingsViewMode, setUltraFeedSettingsViewMode } = useLocalStorageState('ultraFeedSettingsViewMode', (key) => key, initialViewMode);
  const viewMode = ultraFeedSettingsViewMode && ['simple', 'advanced'].includes(ultraFeedSettingsViewMode) ? ultraFeedSettingsViewMode : initialViewMode;
  const setViewMode = (mode: 'simple' | 'advanced') => {
    captureEvent("ultraFeedSettingsViewModeChanged", { from: viewMode, to: mode });
    setUltraFeedSettingsViewMode(mode);
  };

  const [simpleViewTruncationLevels, setSimpleViewTruncationLevels] = useState(() => 
    deriveSimpleViewTruncationLevelsFromSettings(settings, truncationMaps)
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
    setSimpleViewTruncationLevels(deriveSimpleViewTruncationLevelsFromSettings(settings, truncationMaps));
  }, [settings, truncationMaps]);

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
    field: 'incognitoMode',
    checked: boolean
  ) => {
    setZodErrors(null);
    if (field === 'incognitoMode') {
      updateForm(field, checked);
    }
  }, [updateForm]);

  const handleLineClampChange = useCallback((value: number | string) => {
    const strValue = String(value).trim();
    if (strValue === '') {
      updateDisplaySettingForm('lineClampNumberOfLines', '');
    } else {
      const numValue = parseInt(strValue, 10);
      updateDisplaySettingForm('lineClampNumberOfLines', isNaN(numValue) ? '' : numValue);
    }
  }, [updateDisplaySettingForm]);

  const handleWordCountChange = useCallback((
    field: 'postInitialWords' | 'postMaxWords' | 'commentCollapsedInitialWords' | 'commentExpandedInitialWords' | 'commentMaxWords',
    value: string | number
  ) => {
    const strValue = String(value).trim();
    if (strValue === '') {
      updateDisplaySettingForm(field, '');
    } else {
      const numValue = parseInt(strValue, 10);
      updateDisplaySettingForm(field, isNaN(numValue) ? '' : numValue);
    }
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
        subscriptionsFeedSettings: settings.resolverSettings.subscriptionsFeedSettings,
      },
      displaySettings: {
        lineClampNumberOfLines: 0, // Placeholder, will be set below
        postInitialWords: 0, // Placeholder, will be set below
        postMaxWords: 0, // Placeholder, will be set below
        commentCollapsedInitialWords: 0, // Placeholder, will be set below
        commentExpandedInitialWords: 0, // Placeholder, will be set below
        commentMaxWords: 0, // Placeholder, will be set below
      }
    };
    
    if (viewMode === 'simple') {
      // In simple mode, convert truncation levels back to word counts
      settingsToUpdate.displaySettings!.lineClampNumberOfLines = 0; // No line clamping in simple mode
      settingsToUpdate.displaySettings!.commentCollapsedInitialWords = truncationMaps.commentMap[simpleViewTruncationLevels.commentCollapsedInitialLevel];
      settingsToUpdate.displaySettings!.commentExpandedInitialWords = truncationMaps.commentMap[simpleViewTruncationLevels.commentExpandedInitialLevel];
      settingsToUpdate.displaySettings!.commentMaxWords = truncationMaps.commentMap[simpleViewTruncationLevels.commentMaxLevel];
      settingsToUpdate.displaySettings!.postInitialWords = truncationMaps.postMap[simpleViewTruncationLevels.postInitialLevel];
      settingsToUpdate.displaySettings!.postMaxWords = truncationMaps.postMap[simpleViewTruncationLevels.postMaxLevel];
      
    } else {
      // In advanced mode, use the form values directly
      settingsToUpdate.displaySettings!.lineClampNumberOfLines = parseNumericInputAsZeroOrNumber(
        formValues.displaySetting.lineClampNumberOfLines,
        0 
      );
      settingsToUpdate.displaySettings!.postInitialWords = parseNumericInputAsZeroOrNumber(
        formValues.displaySetting.postInitialWords,
        DEFAULT_SETTINGS.displaySettings.postInitialWords
      );
      settingsToUpdate.displaySettings!.postMaxWords = parseNumericInputAsZeroOrNumber(
        formValues.displaySetting.postMaxWords,
        DEFAULT_SETTINGS.displaySettings.postMaxWords
      );
      settingsToUpdate.displaySettings!.commentCollapsedInitialWords = parseNumericInputAsZeroOrNumber(
        formValues.displaySetting.commentCollapsedInitialWords,
        DEFAULT_SETTINGS.displaySettings.commentCollapsedInitialWords
      );
      settingsToUpdate.displaySettings!.commentExpandedInitialWords = parseNumericInputAsZeroOrNumber(
        formValues.displaySetting.commentExpandedInitialWords,
        DEFAULT_SETTINGS.displaySettings.commentExpandedInitialWords
      );
      settingsToUpdate.displaySettings!.commentMaxWords = parseNumericInputAsZeroOrNumber(
        formValues.displaySetting.commentMaxWords,
        DEFAULT_SETTINGS.displaySettings.commentMaxWords
      );
    }

    const result = ultraFeedSettingsSchema.safeParse(settingsToUpdate);

    if (!result.success) {
      const formattedErrors = result.error.format()
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

  }, [formValues, simpleViewTruncationLevels, updateSettings, captureEvent, settings, viewMode, flash, truncationMaps]);
  
  const handleReset = useCallback(() => {
    resetSettingsToDefault();
    setZodErrors(null);
    captureEvent("ultraFeedSettingsReset");
  }, [resetSettingsToDefault, captureEvent]);

  const truncationGridProps = {
    levels: simpleViewTruncationLevels,
    onChange: handleSimpleTruncationLevelChange,
    originalSettings: settings,
    maps: truncationMaps,
    postBreakpointError: zodErrors?.displaySettings?.postInitialWords?._errors?.[0] || zodErrors?.displaySettings?.postMaxWords?._errors?.[0],
    commentBreakpointError: zodErrors?.displaySettings?.commentCollapsedInitialWords?._errors?.[0] || zodErrors?.displaySettings?.commentExpandedInitialWords?._errors?.[0] || zodErrors?.displaySettings?.commentMaxWords?._errors?.[0],
  };
  
  const advancedTruncationProps = {
    values: formValues.displaySetting,
    errors: {
      lineClampNumberOfLines: zodErrors?.displaySettings?.lineClampNumberOfLines?._errors?.[0],
      postInitialWords: zodErrors?.displaySettings?.postInitialWords?._errors?.[0],
      postMaxWords: zodErrors?.displaySettings?.postMaxWords?._errors?.[0],
      commentCollapsedInitialWords: zodErrors?.displaySettings?.commentCollapsedInitialWords?._errors?.[0],
      commentExpandedInitialWords: zodErrors?.displaySettings?.commentExpandedInitialWords?._errors?.[0],
      commentMaxWords: zodErrors?.displaySettings?.commentMaxWords?._errors?.[0],
    },
    onLineClampChange: handleLineClampChange,
    onWordCountChange: handleWordCountChange,
  };
  
  const miscSettingsProps = {
    formValues: {
      incognitoMode: formValues.incognitoMode,
    },
    onBooleanChange: handleBooleanChange,

  };

  const exploreExploitBiasProps = {
    currentLogImpactFactor: formValues.threadInterestModel.logImpactFactor,
    onExploreBiasChange: handleExploreBiasChange,
  };

  const hasAnyErrors = useMemo(() => {
     return zodErrors !== null;
  }, [zodErrors]);

  return (
    <div className={classes.root}>
      <div className={classes.viewModeToggle}>
        <div className={classes.spacer} />
        <div className={classes.viewModeButtonsContainer}>
          <ViewModeButton
            mode="simple"
            currentViewMode={viewMode as 'simple' | 'advanced'}
            onClick={setViewMode}
          />
          <ViewModeButton
            mode="advanced"
            currentViewMode={viewMode as 'simple' | 'advanced'}
            onClick={setViewMode}
          />
        </div>
        <div className={classes.feedbackButtonContainer}>
          <span 
            className={classNames(
              classes.feedbackButton,
              showFeedback && classes.feedbackButtonActive
            )}
            onClick={() => setShowFeedback(!showFeedback)}
          >
            give feedback
          </span>
          {showFeedSelector && <FeedSelectorCheckbox currentFeedType="new" />}
        </div>
      </div>
      {showFeedback && <UltraFeedFeedback />}
      <div className={classes.settingsGroupsContainer}>
        {viewMode === 'simple' ? (
          <SimpleView
            exploreExploitBiasProps={exploreExploitBiasProps}
            sourceWeights={formValues.sourceWeights}
            sourceWeightErrors={sourceWeightErrors}
            onSourceWeightChange={handleSourceWeightChange}
            truncationGridProps={truncationGridProps}
            miscSettingsProps={miscSettingsProps}
          />
        ) : (
          <AdvancedView
            sourceWeights={formValues.sourceWeights}
            sourceWeightErrors={sourceWeightErrors}
            onSourceWeightChange={handleSourceWeightChange}
            advancedTruncationProps={advancedTruncationProps}
            commentScoringFormValues={formValues.commentScoring}
            commentScoringErrors={zodErrors?.resolverSettings?.commentScoring ?? null}
            onCommentScoringFieldChange={handleCommentScoringFieldChange}
            threadInterestModelFormValues={formValues.threadInterestModel}
            threadInterestModelErrors={zodErrors?.resolverSettings?.threadInterestModel ?? null}
            onThreadInterestFieldChange={handleThreadInterestFieldChange}
            miscSettingsProps={miscSettingsProps}
          />
        )}
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

export default UltraFeedSettings;

 
