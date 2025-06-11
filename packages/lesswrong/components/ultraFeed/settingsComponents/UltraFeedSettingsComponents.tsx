import React from 'react';
import classNames from 'classnames';
import { useStyles, defineStyles } from '../../hooks/useStyles';
import { 
  TruncationLevel, 
  UltraFeedSettingsType,
  sourceWeightConfigs,
  truncationLevels,
  levelToWordCountMap,
  levelToPostWordCountMap,
  DEFAULT_SETTINGS,
  ThreadInterestModelFormState,
  CommentScoringFormState
} from '../ultraFeedSettingsTypes';
import { FeedItemSourceType } from '../ultraFeedTypes';
import Slider from '@/lib/vendor/@material-ui/core/src/Slider';
import Checkbox from '@/lib/vendor/@material-ui/core/src/Checkbox';
import { ZodFormattedError } from 'zod';
import LWTooltip from '@/components/common/LWTooltip';
import ForumIcon from '@/components/common/ForumIcon';

const styles = defineStyles('UltraFeedSettingsComponents', (theme: ThemeType) => ({
  settingGroup: {
    backgroundColor: theme.palette.background.paper,
    width: '100%',
    padding: 16,
    border: `1px solid ${theme.palette.grey[300]}`,
    borderRadius: 4,
    paddingLeft: 32,
    paddingRight: 32,
    paddingTop: 24,
    paddingBottom: 24,
    [theme.breakpoints.down('sm')]: {
      paddingLeft: 16,
      paddingRight: 16,
      paddingTop: 16,
      paddingBottom: 16,
    },
  },
  groupTitle: {
    fontSize: '1.3rem',
    fontWeight: 600,
    marginBottom: 8,
    fontFamily: 'inherit',
  },
  groupDescription: {
    marginBottom: 16,
    color: theme.palette.text.dim,
    fontSize: '1.1rem',
    fontFamily: 'inherit',
    '& ul': {
      paddingInlineStart: "30px"
    },
  },
  formulaDescription: {
    fontSize: '0.9rem',
    fontWeight: 600,
    lineHeight: '2.5',
    '& code': {
      fontSize: '0.8rem',
      fontWeight: 600,
      backgroundColor: theme.palette.grey[200],
      padding: '4px 8px',
      borderRadius: 4,
    }
  },
  sourceWeightItem: {
    marginBottom: 16,
  },
  sourceWeightContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
  },
  sourceWeightLabel: {
    fontSize: '1.15rem',
    width: 160,
    flexShrink: 0,
  },
  sourceWeightDescription: {
    fontSize: '1.1rem',
    color: theme.palette.text.dim,
    marginTop: 4,
    '& ul': {
      paddingInlineStart: "30px"
    },
    '& code': {
      fontSize: '0.8rem',
      fontWeight: 600,
      backgroundColor: theme.palette.grey[200],
      padding: '4px 4px',
      borderRadius: 4,
    }
  },
  sourceWeightSlider: {
    width: '100%',
    flexGrow: 1,
  },
  sourceWeightInput: {
    marginLeft: 12,
    width: 70,
    padding: 6,
    border: '1px solid ' + theme.palette.grey[400],
    borderRadius: 4,
    color: theme.palette.text.primary,
    background: theme.palette.background.default,
    textAlign: 'right',
  },
  threadAggSelect: {
    minWidth: "100px",
    marginLeft: "auto",
  },
  lineClampLabel: {
    fontSize: '1.1rem',
    width: 70,
    fontWeight: 600,
    flexShrink: 0,
  },
  invalidInput: {
    borderColor: theme.palette.error.main,
  },
  disabledInput: {
    opacity: 0.5,
    pointerEvents: 'none',
    backgroundColor: theme.palette.grey[100],
  },
  errorMessage: {
    color: theme.palette.error.main,
    fontSize: '1.1rem',
    marginTop: 4,
    textAlign: 'right',
  },
  errorMessageCenteredText: {
    textAlign: 'center',
    width: '100%',
  },
  customWarningMessage: {
    fontSize: '1.1rem',
    color: theme.palette.warning.main,
  },
  checkboxContainer: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: 8,
  },
  checkboxInput: {
    marginRight: 8,
    padding: 4,
  },
  checkboxLabel: {
    cursor: 'pointer',
    fontSize: '1.15rem',
    flexGrow: 1,
  },
  collapsibleHeader: {
    display: 'flex',
    alignItems: 'center',
    cursor: 'pointer',
    marginBottom: 0,
  },
  collapsibleHeaderExpanded: {
    marginBottom: 16,
  },
  collapsibleTitle: {
    fontSize: '1.3rem',
    fontWeight: 600,
    marginRight: 8,
  },
  collapsibleIcon: {
    verticalAlign: 'middle',
    transform: "translateY(2px)",
    fontSize: 18,
    transition: "transform 0.2s ease-in-out",
    color: theme.palette.grey[700],
    '&:hover': {
      color: theme.palette.grey[900],
    }
  },
  collapsibleIconExpanded: {
    transform: "translateY(2px) rotate(90deg)",
  },
  preLineDescription: {
    whiteSpace: 'pre-line',
  },
  truncationSection: {
    marginBottom: 20,
  },
  truncationSectionTitle: {
    fontSize: '1.2rem',
    fontWeight: 600,
    marginBottom: 12,
    fontFamily: 'inherit',
  },
  truncationItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  truncationLabel: {
    fontSize: '1.1rem',
    flexShrink: 0,
  },
  truncationOptionSelect: {
    padding: '4px 8px',
    fontSize: '1.1rem',
    fontFamily: 'inherit',
    cursor: 'pointer',
    border: `1px solid ${theme.palette.grey[400]}`,
    borderRadius: 4,
    backgroundColor: theme.palette.background.default,
    color: theme.palette.text.primary,
    minWidth: 120,
    textAlign: 'center',
  },
}));

interface CollapsibleSettingGroupProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  className?: string;
}

const CollapsibleSettingGroup: React.FC<CollapsibleSettingGroupProps> = ({
  title,
  children,
  defaultOpen = false,
  className,
}) => {
  const classes = useStyles(styles);
  const [isExpanded, setIsExpanded] = React.useState(defaultOpen);

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div className={className}>
      <div
        className={classNames(classes.collapsibleHeader, { [classes.collapsibleHeaderExpanded]: isExpanded })}
        onClick={toggleExpanded}
      >
        <div className={classNames(classes.collapsibleTitle)}>{title}</div>
        <LWTooltip title={isExpanded ? "Collapse" : "Expand"} hideOnTouchScreens>
          <ForumIcon
            icon="ThickChevronRight"
            className={classNames(classes.collapsibleIcon, {
              [classes.collapsibleIconExpanded]: isExpanded,
            })}
          />
        </LWTooltip>
      </div>
      {isExpanded && <>{children}</>}
    </div>
  );
};

interface SourceWeightsSettingsProps {
  weights: Record<FeedItemSourceType, number | '' >;
  errors: Record<FeedItemSourceType, string | undefined>;
  onChange: (key: FeedItemSourceType, value: string | number) => void;
  defaultOpen?: boolean;
}

export const SourceWeightsSettings: React.FC<SourceWeightsSettingsProps> = ({
  weights,
  errors,
  onChange,
  defaultOpen = true,
}) => {
  const classes = useStyles(styles);
  return (
    <CollapsibleSettingGroup title="Source Weights" defaultOpen={defaultOpen} className={classes.settingGroup}>
      <p className={classes.groupDescription}>
        Adjust the relative frequency of different content types in your feed. Higher numbers mean more frequent items. Uses weighted sampling.
      </p>
      {sourceWeightConfigs.map((config) => {
        const { key: sourceKey, label, description } = config;
        const currentValue = weights[sourceKey];
        const errorMessage = errors[sourceKey];
        const sliderValue = typeof currentValue === 'number' ? currentValue : 0;

        return (
          <div key={sourceKey} className={classes.sourceWeightItem}>
            <div className={classes.sourceWeightContainer}>
              <label className={classes.sourceWeightLabel}>{label}</label>
              <Slider
                className={classes.sourceWeightSlider}
                value={sliderValue}
                onChange={(event: React.ChangeEvent<{}>, newValue: number | number[]) => onChange(sourceKey, newValue as number)}
                min={0}
                max={100}
                step={5}
              />
              <input
                type="number"
                className={classNames(classes.sourceWeightInput, {
                  [classes.invalidInput]: !!errorMessage
                })}
                value={currentValue}
                onChange={(e) => onChange(sourceKey, e.target.value)}
                min={0}
                max={100}
                step={5}
              />
            </div>
            <p className={classes.sourceWeightDescription}>{description}</p>
            {errorMessage && (
              <p className={classes.errorMessage}>{errorMessage}</p>
            )}
          </div>
        );
      })}
    </CollapsibleSettingGroup>
  );
};

const getCommentLevelLabel = (level: TruncationLevel): string => {
  // if (level === 'Very Short') return `${level} (2 lines)`; // uncomment if we reintroduce line clamp as default
  if (level === 'Full') return `${level} (no limit)`;
  
  const wordCount = levelToWordCountMap[level];
  return typeof wordCount === 'number' ? `${level} (${wordCount} words)` : level;
};

const getPostLevelLabel = (level: TruncationLevel): string => {
  if (level === 'Full') return `${level} (no limit)`;
  
  const wordCount = levelToPostWordCountMap[level];
  return typeof wordCount === 'number' ? `${level} (${wordCount} words)` : level;
};

type SimpleViewTruncationLevels = {
  commentCollapsedInitialLevel: TruncationLevel;
  commentExpandedInitialLevel: TruncationLevel;
  commentMaxLevel: TruncationLevel;
  postInitialLevel: TruncationLevel;
  postMaxLevel: TruncationLevel;
};

interface TruncationLevelDropdownProps {
  field: keyof SimpleViewTruncationLevels;
  value: TruncationLevel;
  onChange: (field: keyof SimpleViewTruncationLevels, value: TruncationLevel) => void;
  label: string;
}

const TruncationLevelDropdown: React.FC<TruncationLevelDropdownProps> = ({
  field,
  value,
  onChange,
  label
}) => {
  const classes = useStyles(styles);
  const isPostDropdown = field.startsWith('post');
  const getLabel = isPostDropdown ? getPostLevelLabel : getCommentLevelLabel;
  
  return (
    <div className={classes.truncationItem}>
      <label className={classes.truncationLabel}>{label}</label>
      <select
        className={classes.truncationOptionSelect}
        value={value}
        onChange={(e) => onChange(field, e.target.value as TruncationLevel)}
      >
        {truncationLevels.map(levelOption => (
          <option key={levelOption} value={levelOption}>
            {getLabel(levelOption)}
          </option>
        ))}
      </select>
    </div>
  );
};

interface TruncationInputProps {
  field: 'postInitialWords' | 'postMaxWords' | 'commentCollapsedInitialWords' | 'commentExpandedInitialWords' | 'commentMaxWords' | 'lineClampNumberOfLines';
  value: number | '';
  onChange: (field: any, value: string | number) => void;
  label: string;
  error?: string;
  disabled?: boolean;
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
}

const TruncationInput: React.FC<TruncationInputProps> = ({
  field,
  value,
  onChange,
  label,
  error,
  disabled,
  min = 10,
  max,
  step = 50,
  placeholder = 'unset',
}) => {
  const classes = useStyles(styles);
  const displayValue = value === '' ? '' : value;
  
  return (
    <div className={classes.truncationItem}>
      <label className={classes.truncationLabel}>{label}</label>
      <input
        type="number"
        className={classNames(classes.sourceWeightInput, {
          [classes.invalidInput]: !!error,
          [classes.disabledInput]: disabled,
        })}
        value={displayValue}
        onChange={(e) => onChange(field, e.target.value)}
        min={min}
        max={max}
        step={step}
        placeholder={placeholder}
        disabled={disabled}
      />
      {error && <p className={classes.errorMessage}>{error}</p>}
    </div>
  );
};

const checkForNonstandardValues = (originalSettings: UltraFeedSettingsType) => { 
  const allowedCommentValues = new Set(Object.values(levelToWordCountMap));
  const allowedPostValues = new Set(Object.values(levelToPostWordCountMap));

  const { displaySettings } = originalSettings;

  // Temporarily commenting out lineclamp check while broken
  // if (displaySettings.lineClampNumberOfLines !== 0) return true;

  // Check if the current word count settings match standard truncation levels
  if (!allowedCommentValues.has(displaySettings.commentCollapsedInitialWords)) return true;
  if (!allowedCommentValues.has(displaySettings.commentExpandedInitialWords)) return true;
  if (!allowedCommentValues.has(displaySettings.commentMaxWords)) return true;
  if (!allowedPostValues.has(displaySettings.postInitialWords)) return true;
  if (!allowedPostValues.has(displaySettings.postMaxWords)) return true;

  return false;
};

export interface TruncationGridSettingsProps {
  levels: SimpleViewTruncationLevels;
  onChange: (field: keyof SimpleViewTruncationLevels, value: TruncationLevel) => void;
  originalSettings: UltraFeedSettingsType;
  defaultOpen?: boolean;
  postBreakpointError?: string;
  commentBreakpointError?: string;
}

export const TruncationGridSettings: React.FC<TruncationGridSettingsProps> = ({
  levels,
  onChange,
  originalSettings,
  defaultOpen = true,
  postBreakpointError,
  commentBreakpointError,
}) => {
  const classes = useStyles(styles);
  const showWarning = checkForNonstandardValues(originalSettings);

  return (
    <CollapsibleSettingGroup title="Content Display Length" defaultOpen={defaultOpen} className={classes.settingGroup}>
      <div className={classes.groupDescription}>
        <ul>
          <li>If text is longer than max word in-place, "read more" triggers a popup.</li>
          <li>Some comments are deemphasized and will be truncated to a lower level.</li>
        </ul>
      </div>
      {showWarning && (
        <p className={classes.customWarningMessage}>
          Note: Some settings were customized in the Advanced view. Saving from the Simple view will overwrite them.
        </p>
      )}
      
      <div className={classes.truncationSection}>
        <h4 className={classes.truncationSectionTitle}>Posts</h4>
        <TruncationLevelDropdown
          field="postInitialLevel"
          value={levels.postInitialLevel}
          onChange={onChange}
          label="Initial words to display"
        />
        <TruncationLevelDropdown
          field="postMaxLevel"
          value={levels.postMaxLevel}
          onChange={onChange}
          label="Max words in-place"
        />
        {postBreakpointError && (
          <p className={classes.errorMessage}>{postBreakpointError}</p>
        )}
      </div>

      <div className={classes.truncationSection}>
        <h4 className={classes.truncationSectionTitle}>Comments</h4>
        <TruncationLevelDropdown
          field="commentCollapsedInitialLevel"
          value={levels.commentCollapsedInitialLevel}
          onChange={onChange}
          label="Initial (deemphasized)"
        />
        <TruncationLevelDropdown
          field="commentExpandedInitialLevel"
          value={levels.commentExpandedInitialLevel}
          onChange={onChange}
          label="Initial (emphasized)"
        />
        <TruncationLevelDropdown
          field="commentMaxLevel"
          value={levels.commentMaxLevel}
          onChange={onChange}
          label="Max words in-place"
        />
        {commentBreakpointError && (
          <p className={classes.errorMessage}>{commentBreakpointError}</p>
        )}
      </div>
    </CollapsibleSettingGroup>
  );
};

export interface AdvancedTruncationSettingsProps {
  values: {
    lineClampNumberOfLines: number | '';
    postInitialWords: number | '';
    postMaxWords: number | '';
    commentCollapsedInitialWords: number | '';
    commentExpandedInitialWords: number | '';
    commentMaxWords: number | '';
  };
  errors: {
    lineClampNumberOfLines?: string;
    postInitialWords?: string;
    postMaxWords?: string;
    commentCollapsedInitialWords?: string;
    commentExpandedInitialWords?: string;
    commentMaxWords?: string;
  };
  onLineClampChange: (value: number | string) => void;
  onWordCountChange: (field: 'postInitialWords' | 'postMaxWords' | 'commentCollapsedInitialWords' | 'commentExpandedInitialWords' | 'commentMaxWords', value: string | number) => void;
  defaultOpen?: boolean;
}

export const AdvancedTruncationSettings: React.FC<AdvancedTruncationSettingsProps> = ({
  values,
  errors,
  onLineClampChange,
  onWordCountChange,
  defaultOpen = true,
}) => {
  const classes = useStyles(styles);

  return (
    <CollapsibleSettingGroup title="Advanced Truncation" defaultOpen={defaultOpen} className={classes.settingGroup}>
      <p className={classes.groupDescription}>
        If text is longer than max word in-place, "read more" triggers a popup.
      </p>
      
      <div className={classes.truncationSection}>
        <h4 className={classes.truncationSectionTitle}>Posts</h4>
        <TruncationInput
          field="postInitialWords"
          value={values.postInitialWords}
          onChange={onWordCountChange}
          label="Initial words"
          error={errors.postInitialWords}
        />
        <TruncationInput
          field="postMaxWords"
          value={values.postMaxWords}
          onChange={onWordCountChange}
          label="Max words in-place"
          error={errors.postMaxWords}
        />
      </div>

      <div className={classes.truncationSection}>
        <h4 className={classes.truncationSectionTitle}>Comments</h4>
        {/* Temporarily commenting out lineclamp settings while broken
        <TruncationInput
          field="lineClampNumberOfLines"
          value={values.lineClampNumberOfLines}
          onChange={onLineClampChange}
          label="Truncate by line count"
          error={errors.lineClampNumberOfLines}
          min={0}
          max={10}
          step={1}
        />
        {values.lineClampNumberOfLines !== 0 && values.lineClampNumberOfLines !== '' && (
          <p className={classes.groupDescription}>
            When line clamp is non-zero, deemphasized comments are truncated based on number of lines instead of word count.
          </p>
        )}
        */}
        <p className={classes.groupDescription}>
          Some comments are deemphasized and will be truncated to a shorter length.
        </p>
        <TruncationInput
          field="commentCollapsedInitialWords"
          value={values.commentCollapsedInitialWords}
          onChange={onWordCountChange}
          label="Initial (deemphasized)"
          error={errors.commentCollapsedInitialWords}
        />
        <TruncationInput
          field="commentExpandedInitialWords"
          value={values.commentExpandedInitialWords}
          onChange={onWordCountChange}
          label="Initial (emphasized)"
          error={errors.commentExpandedInitialWords}
        />
        <TruncationInput
          field="commentMaxWords"
          value={values.commentMaxWords}
          onChange={onWordCountChange}
          label="Max words in-place"
          error={errors.commentMaxWords}
        />
      </div>
    </CollapsibleSettingGroup>
  );
};

export interface ExploreExploitBiasSettingsProps {
  currentLogImpactFactor: number | ''; 
  onExploreBiasChange: (newExploreBiasValue: number) => void;
  defaultOpen?: boolean;
}

export const ExploreExploitBiasSettings: React.FC<ExploreExploitBiasSettingsProps> = ({
  currentLogImpactFactor,
  onExploreBiasChange,
  defaultOpen = true, 
}) => {
  const classes = useStyles(styles);

  // Convert logImpactFactor (0-3 range, where 0 is high exploration in LIF terms) to exploreBias (0-2 range, where 2 is high exploration)
  // exploreBias = 2 - logImpactFactor. Slider default is 1.5, means logImpactFactor = 0.5
  const exploreBiasValue = typeof currentLogImpactFactor === 'number' ? (2 - currentLogImpactFactor) : 1.5; 
  // Ensure slider value is within its bounds, clamping might be good defense if currentLogImpactFactor is outside expected 0-2 for (2-LIF)
  const clampedExploreBiasValue = Math.max(0, Math.min(2, exploreBiasValue));

  return (
    <CollapsibleSettingGroup title="Explore-Exploit Bias" defaultOpen={defaultOpen} className={classes.settingGroup}>
      <p className={classNames(classes.groupDescription, classes.preLineDescription)}>
        Choose how much the feed prioritizes content based on your past engagement versus popular or new content.
      </p>
      <div className={classes.sourceWeightItem}>
        <div className={classes.sourceWeightContainer}>
          <label className={classes.sourceWeightLabel}>Explore Bias</label>
          <Slider
            className={classes.sourceWeightSlider}
            value={clampedExploreBiasValue} // Slider displays 0-2 range
            onChange={(_, newValue) => onExploreBiasChange(newValue as number)}
            min={0}
            max={2}
            step={0.5}
          />
          <input
            type="number"
            className={classNames(classes.sourceWeightInput)}
            value={clampedExploreBiasValue} // Input displays 0-2 range
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              if (!isNaN(val)) {
                onExploreBiasChange(Math.max(0, Math.min(2, val)));
              }
            }}
            min={0}
            max={2}
            step={0.5}
          />
        </div>
        <div className={classes.sourceWeightDescription}>
          <ul>
            <li>Left: Strongly prefer content related to what you've read, upvoted, commented on, or from authors you follow.</li>
            <li>Right: Indifferent to your past interactions, recommend what generally seems good.</li>
          </ul>
          <p>
            This adjusts <code>Log Impact Factor</code> and <code>Subscribed Author Boost</code> located in Advanced Settings and <code>Subscribed Author</code> proportion in Source Weights.
          </p>
        </div>
      </div>
    </CollapsibleSettingGroup>
  );
};

interface MultipliersSettingsProps {
  formValues: CommentScoringFormState;
  errors: ZodFormattedError<CommentScoringFormState, string> | null;
  onFieldChange: (field: keyof CommentScoringFormState, value: number | string) => void;
  defaultOpen?: boolean;
}

export const MultipliersSettings: React.FC<MultipliersSettingsProps> = ({
  formValues, 
  errors,
  onFieldChange,
  defaultOpen,
}) => {
  const classes = useStyles(styles);

  const onChangeForField = (fieldName: keyof CommentScoringFormState) => {
    return (value: number | string) => onFieldChange(fieldName, value);
  };

  const defaultCommentScoringSettings = DEFAULT_SETTINGS.resolverSettings.commentScoring;

  const multiplierFieldsConfig = [
    {
      key: 'quickTakeBoost' as const,
      label: "Quick Take Boost",
      description: "Multiplier applied to the score of Quick Takes comments.",
      min: 0.5, max: 3.0, step: 0.01, defaultVal: defaultCommentScoringSettings.quickTakeBoost,
    },
    {
      key: 'commentSubscribedAuthorMultiplier' as const,
      label: "Subscribed Boost",
      description: `Multiplier for comments by authors you subscribe to or follow. Default: ${defaultCommentScoringSettings.commentSubscribedAuthorMultiplier}`,
      min: 1, max: 5, step: 0.1, defaultVal: defaultCommentScoringSettings.commentSubscribedAuthorMultiplier,
    },
    {
      key: 'ultraFeedSeenPenalty' as const,
      label: "Seen Penalty",
      description: `Score multiplier for items already marked as seen (0 to 1). Default: ${defaultCommentScoringSettings.ultraFeedSeenPenalty}`,
      min: 0, max: 1, step: 0.01, defaultVal: defaultCommentScoringSettings.ultraFeedSeenPenalty,
    },
    {
      key: 'commentDecayFactor' as const,
      label: "Decay Factor",
      description: `Controls how quickly comments lose score over time. Higher values mean faster decay. Default: ${defaultCommentScoringSettings.commentDecayFactor}`,
      min: 1.0, max: 2.5, step: 0.1, defaultVal: defaultCommentScoringSettings.commentDecayFactor,
    },
    {
      key: 'commentDecayBiasHours' as const,
      label: "Decay Bias (hours)",
      description: `Hours to add to comment age for decay calculation. Higher values give newer comments a boost. Default: ${defaultCommentScoringSettings.commentDecayBiasHours}`,
      min: 0, max: 8, step: 0.5, defaultVal: defaultCommentScoringSettings.commentDecayBiasHours,
    },
    {
      key: 'threadScoreFirstN' as const,
      label: "Thread First N",
      description: `Number of top comments to consider when calculating thread score. Default: ${defaultCommentScoringSettings.threadScoreFirstN}`,
      min: 1, max: 20, step: 1, defaultVal: defaultCommentScoringSettings.threadScoreFirstN,
    },
  ];

  // Separate config for threadScoreAggregation due to different input type
  const threadScoreAggregationConfig = {
    key: 'threadScoreAggregation' as const,
    label: "Thread Agg.",
    description: `How to aggregate comment scores into a thread score. Default: ${defaultCommentScoringSettings.threadScoreAggregation}`,
    options: [
      { value: "sum", label: "Sum" },
      { value: "max", label: "Max" },
      { value: "logSum", label: "Log Sum" },
      { value: "avg", label: "Average" },
    ],
    defaultVal: defaultCommentScoringSettings.threadScoreAggregation,
  };

  return (
    <CollapsibleSettingGroup title="Comment Scoring" defaultOpen={defaultOpen} className={classes.settingGroup}>
      <div className={classes.groupDescription}>
        <p className={classes.formulaDescription}>
          <code>timeDecayedKarma = ((karma + 1) / (ageHours + commentDecayBiasHours)^(commentDecayFactor))</code><br/>
          <code>individualCommentScore = timeDecayedKarma * quickTakeBoost * subscribedMultiplier * seenPenalty</code><br/>
          <code>baseThreadScore = aggregateMethod(firstN(individualCommentScore))</code>
        </p>
      </div>

      {multiplierFieldsConfig.map(field => {
        const currentValue = formValues[field.key];
        const currentError = errors?.[field.key]?._errors[0];
        const sliderValue = typeof currentValue === 'number' ? currentValue : field.defaultVal;
        const handleChange = onChangeForField(field.key);

        return (
          <div key={field.key} className={classes.sourceWeightItem}>
            <div className={classes.sourceWeightContainer}>
              <label className={classes.sourceWeightLabel}>{field.label}</label>
              <Slider
                className={classes.sourceWeightSlider}
                value={sliderValue}
                onChange={(_, val) => handleChange(val as number)}
                min={field.min}
                max={field.max}
                step={field.step}
              />
              <input
                type="number"
                className={classNames(classes.sourceWeightInput, { [classes.invalidInput]: !!currentError })}
                value={currentValue}
                onChange={(e) => handleChange(e.target.value)}
                min={field.min}
                max={field.max}
                step={field.step}
              />
            </div>
            <p className={classes.sourceWeightDescription}>{field.description}</p>
            {currentError && (
              <p className={classes.errorMessage}>{currentError}</p>
            )}
          </div>
        );
      })}

      {/* Special handling for threadScoreAggregation */}
      {(() => {
        const field = threadScoreAggregationConfig;
        const currentValue = formValues[field.key];
        const currentError = errors?.[field.key]?._errors[0];
        const handleChange = onChangeForField(field.key);

        return (
          <div key={field.key} className={classes.sourceWeightItem}>
            <div className={classes.sourceWeightContainer}>
              <label className={classes.sourceWeightLabel}>{field.label}</label>
              <select
                className={classNames(classes.sourceWeightInput, classes.threadAggSelect, { [classes.invalidInput]: !!currentError })}
                value={currentValue}
                onChange={(e) => handleChange(e.target.value)}
              >
                {field.options.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <p className={classes.sourceWeightDescription}>{field.description}</p>
            {currentError && (
              <p className={classes.errorMessage}>{currentError}</p>
            )}
          </div>
        );
      })()}

    </CollapsibleSettingGroup>
  );
};

interface ThreadInterestTuningSettingsProps {
  formValues: ThreadInterestModelFormState;
  errors: ZodFormattedError<ThreadInterestModelFormState, string> | null;
  onFieldChange: (field: keyof ThreadInterestModelFormState, value: number | string) => void;
  defaultOpen?: boolean;
}

export const ThreadInterestTuningSettings: React.FC<ThreadInterestTuningSettingsProps> = ({
  formValues,
  errors,
  onFieldChange,
  defaultOpen,
}) => {
  const classes = useStyles(styles);

  const defaultThreadInterestModelSettings = DEFAULT_SETTINGS.resolverSettings.threadInterestModel;

  const fields = [
    {
      key: 'commentCoeff' as const,
      label: "Comment Coefficient",
      description: "How much each comment you have in a thread contributes to further activity in that thread being shown.",
      min: 0, max: 10, step: 0.5, defaultVal: defaultThreadInterestModelSettings.commentCoeff,
    },
    {
      key: 'voteCoeff' as const,
      label: "Vote Coefficient",
      description: "How much each vote you have in a thread contributes to further activity in that thread being shown.",
      min: 0, max: 5, step: 0.25, defaultVal: defaultThreadInterestModelSettings.voteCoeff,
    },
    {
      key: 'viewCoeff' as const,
      label: "View Coefficient",
      description: "How much viewing (and especially expanding) an item contributes to further activity in a thread being shown.",
      min: 0, max: 2, step: 0.25, defaultVal: defaultThreadInterestModelSettings.viewCoeff,
    },
    {
      key: 'onReadPostFactor' as const,
      label: "Read Post Factor",
      description: "Multiplier if the thread is on a post a user has read.",
      min: 0.5, max: 2.0, step: 0.5, defaultVal: defaultThreadInterestModelSettings.onReadPostFactor,
    },
    {
      key: 'logImpactFactor' as const,
      label: "Log Impact Factor",
      description: "Scales the effect of the combined log-of-factors on the final multiplier (Multiplier = 1 + LogOfFactors * Impact).",
      min: 0, max: 3, step: 0.5, defaultVal: defaultThreadInterestModelSettings.logImpactFactor,
    },
    {
      key: 'minOverallMultiplier' as const,
      label: "Min Overall Multiplier",
      description: "The minimum final multiplier applied to the thread's base score (e.g., 0.5 for max 50% reduction).",
      min: 0.1, max: 1.0, step: 0.05, defaultVal: defaultThreadInterestModelSettings.minOverallMultiplier,
    },
    {
      key: 'maxOverallMultiplier' as const,
      label: "Max Overall Multiplier",
      description: "The maximum final multiplier applied to the thread's base score (e.g., 20 for max 20× boost).",
      min: 1.0, max: 20.0, step: 0.5, defaultVal: defaultThreadInterestModelSettings.maxOverallMultiplier,
    },
  ];

  return (
    <CollapsibleSettingGroup title="Comment Thread Scoring" defaultOpen={defaultOpen} className={classes.settingGroup}>
      <div className={classes.groupDescription}>
        <p className={classes.formulaDescription}>
          <code>engagementFactor = (1+commentCoeff*numComments) * (1+voteCoeff*voteScore) * (1+viewCoeff*viewScore) * onReadPostFactor</code><br/>
          <code>threadMultiplier = 1 + log(engagementFactor) * logImpactFactor</code><br/>
          <code>clampedThreadMultiplier = clamped(threadMultiplier, minOverallMultiplier, maxOverallMultiplier)</code><br/><br/>
          <code>overallThreadScore = baseThreadScore * clampedThreadMultiplier</code>
        </p>
        <ul>
          <li>See Comment Scoring section for calculation of baseThreadScore</li>
          <li>voteScore: smallUpvotes = 1 vote unit, bigUpovtes = 5</li>
          <li>viewScore: itemOnViewport = 1 view unit, itemExpanded = 3 view units</li>
          <li>onReadPostFactor applies if thread is on a post user has read, otherwise 1.0</li>
        </ul>
      </div>
      {fields.map(f => {
        const currentValue = formValues[f.key];
        const currentError = errors?.[f.key]?._errors[0];
        const sliderValue = typeof currentValue === 'number' ? currentValue : f.defaultVal;

        return (
          <div key={f.key} className={classes.sourceWeightItem}>
            <div className={classes.sourceWeightContainer}>
              <label className={classes.sourceWeightLabel}>{f.label}</label>
              <Slider
                className={classes.sourceWeightSlider}
                value={sliderValue}
                onChange={(_, val) => onFieldChange(f.key, val as number)}
                min={f.min}
                max={f.max}
                step={f.step}
              />
              <input
                type="number"
                className={classNames(classes.sourceWeightInput, { [classes.invalidInput]: !!currentError })}
                value={currentValue}
                onChange={(e) => onFieldChange(f.key, e.target.value)}
                min={f.min}
                max={f.max}
                step={f.step}
              />
            </div>
            <p id={`${f.key}-label`} className={classes.sourceWeightDescription}>{f.description} Default: {f.defaultVal}</p>
            {currentError && <p id={`${f.key}-error`} className={classes.errorMessage}>{currentError}</p>}
          </div>
        );
      })}
    </CollapsibleSettingGroup>
  );
};

export interface MiscSettingsProps {
  formValues: {
    incognitoMode: boolean;
    postTitlesAreModals: boolean;
    defaultOpen?: boolean;
  };
  onBooleanChange: (field: 'postTitlesAreModals' | 'incognitoMode', checked: boolean) => void;
  defaultOpen?: boolean;
}

export const MiscSettings: React.FC<MiscSettingsProps> = ({ formValues, onBooleanChange, defaultOpen = true }) => {
  const classes = useStyles(styles);
  return (
    <CollapsibleSettingGroup title="Misc" defaultOpen={defaultOpen} className={classes.settingGroup}>
      <div className={classes.checkboxContainer}>
        <Checkbox
          id="postTitlesAreModalsCheckbox"
          className={classes.checkboxInput}
          checked={formValues.postTitlesAreModals}
          onChange={(e) => onBooleanChange('postTitlesAreModals', e.target.checked)}
          color="primary"
        />
        <label htmlFor="postTitlesAreModalsCheckbox" className={classes.checkboxLabel}>
          Open post titles in modals (on mobile)
        </label>
      </div>
      <p className={classes.groupDescription}>
        When disabled, clicking a post title navigates directly to the post page.
      </p>

      <div className={classes.checkboxContainer}>
        <Checkbox
          id="incognitoModeCheckbox"
          className={classes.checkboxInput}
          checked={formValues.incognitoMode}
          onChange={(e) => onBooleanChange('incognitoMode', e.target.checked)}
          color="primary"
        />
        <label htmlFor="incognitoModeCheckbox" className={classes.checkboxLabel}>
          Incognito Mode
        </label>
      </div>
      <p className={classes.groupDescription}>
        When enabled, the feed algorithm does not log viewing behavior (votes and comments will still influence it). This does not disable standard LessWrong analytics separate from the feed.
      </p>

    </CollapsibleSettingGroup>
  );
};
