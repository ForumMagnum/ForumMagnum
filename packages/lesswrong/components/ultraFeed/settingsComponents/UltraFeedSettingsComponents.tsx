import React from 'react';
import classNames from 'classnames';
import { useStyles, defineStyles } from '../../hooks/useStyles';
import { 
  TruncationLevel, 
  UltraFeedSettingsType,
  sourceWeightConfigs,
  truncationLevels,
  levelToCommentLinesMap,
  levelToCommentBreakpointMap,
  levelToPostBreakpointMap,
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
  truncationGridContainer: {
    display: 'grid',
    gridTemplateColumns: 'auto 1fr 1fr',
    gridTemplateRows: 'auto 1fr 1fr 1fr',
    columnGap: "1px",
    rowGap: "2px",
    alignItems: 'center',
    marginTop: theme.spacing.unit * 2,
  },
  truncationGridHeader: {
    fontWeight: 600,
    textAlign: 'center',
    fontSize: '1.1rem',
    padding: 8,
  },
  truncationGridRowHeader: {
    fontWeight: 600,
    textAlign: 'right',
    fontSize: '1.1rem',
    paddingRight: 8,
  },
  truncationGridCell: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 4,
    paddingBottom: 4,
  },
  truncationOptionSelect: {
    padding: '4px 2px',
    fontSize: '1.1rem',
    fontFamily: 'inherit',
    cursor: 'pointer',
    border: `1px solid ${theme.palette.grey[400]}`,
    borderRadius: 4,
    backgroundColor: theme.palette.background.default,
    color: theme.palette.text.primary,
    minWidth: 100,
    textAlign: 'center',
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

const BreakpointInput = ({
  kind,
  index,
  value,
  errorMessage,
  onChange,
  disabled,
}: {
  kind: 'post' | 'comment';
  index: number;
  value: number | null | '';
  errorMessage?: string;
  disabled?: boolean;
  onChange: (kind: 'post' | 'comment', index: number, value: string | number | null) => void;
}) => {
  const displayValue = value === null || value === '' ? '' : value;
  const classes = useStyles(styles);
  
  return (
    <div className={classes.truncationGridCell}>
      <div>
        <input
          type="number"
          className={classNames(classes.sourceWeightInput, {
            [classes.invalidInput]: !!errorMessage,
            [classes.disabledInput]: disabled,
          })}
          onChange={(e) => onChange(kind, index, e.target.value ?? '')}
          value={displayValue}
          min={10}
          step={50}
          placeholder={'unset'}
          disabled={disabled}
        />
        {errorMessage && (
          <p id={`breakpoint-error-${kind}-${index}`} className={classes.errorMessage} style={{textAlign: 'center'}}>
            {errorMessage}
          </p>
        )}
      </div>
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
  if (level === 'Very Short') return `${level} (2 lines)`;
  if (level === 'Full') return `${level} (no limit)`;
  if (level === 'Unset') return level;
  
  const wordCount = levelToCommentBreakpointMap[level];
  return typeof wordCount === 'number' ? `${level} (${wordCount} words)` : level;
};

const getPostLevelLabel = (level: TruncationLevel): string => {
  if (level === 'Full') return `${level} (no limit)`;
  if (level === 'Unset') return level;
  
  const wordCount = levelToPostBreakpointMap[level];
  return typeof wordCount === 'number' ? `${level} (${wordCount} words)` : level;
};

type SimpleViewTruncationLevels = {
  commentLevel0: TruncationLevel;
  commentLevel1: TruncationLevel;
  commentLevel2: TruncationLevel;
  postLevel0: TruncationLevel;
  postLevel1: TruncationLevel;
  postLevel2: TruncationLevel;
};

interface TruncationLevelDropdownProps {
  field: keyof SimpleViewTruncationLevels;
  value: TruncationLevel;
  onChange: (field: keyof SimpleViewTruncationLevels, value: TruncationLevel) => void;
}

const TruncationLevelDropdown: React.FC<TruncationLevelDropdownProps> = ({
  field,
  value,
  onChange
}) => {
  const classes = useStyles(styles);
  const isPostDropdown = field.startsWith('post');
  const getLabel = isPostDropdown ? getPostLevelLabel : getCommentLevelLabel;
  
  return (
    <div className={classes.truncationGridCell}>
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

const arrayHasUnsupported = (
  arr: (number | null | undefined)[] | undefined,
  allowed: Set<number | null>
) => {
  if (!arr) return false;
  if (arr.length > 3) return true;
  
  return arr.some(v => {
    if (v === undefined) return true;
    return !allowed.has(v);
  });
};

const checkMismatch = (originalSettings: UltraFeedSettingsType) => { 
  const allowedLineClamps = new Set(Object.values(levelToCommentLinesMap));
  const allowedCommentValues = new Set(Object.values(levelToCommentBreakpointMap).filter(v => v !== undefined));
  const allowedPostValues = new Set(Object.values(levelToPostBreakpointMap).filter(v => v !== undefined));

  const { displaySettings } = originalSettings;

  if (!allowedLineClamps.has(displaySettings.lineClampNumberOfLines)) return true;

  if (arrayHasUnsupported(displaySettings.commentTruncationBreakpoints, allowedCommentValues)) return true;
  if (arrayHasUnsupported(displaySettings.postTruncationBreakpoints, allowedPostValues)) return true;

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
  const showWarning = checkMismatch(originalSettings);

  const breakpointErrorDisplay = (postBreakpointError || commentBreakpointError) && (
    <>
      <div />
      <div className={classes.truncationGridCell}>
        {postBreakpointError && (
          <p className={classNames(classes.errorMessage, classes.errorMessageCenteredText)}>
            {postBreakpointError}
          </p>
        )}
      </div>
      <div className={classes.truncationGridCell}>
        {commentBreakpointError && (
          <p className={classNames(classes.errorMessage, classes.errorMessageCenteredText)}>
            {commentBreakpointError}
          </p>
        )}
      </div>
    </>
  );

  return (
    <CollapsibleSettingGroup title="Content Display Length" defaultOpen={defaultOpen} className={classes.settingGroup}>
      <div className={classes.groupDescription}>
        <p>
          Choose how much content to show for posts and comments.
        </p>
        <ul>
          <li>Deemphasized comments start at Level 0. Comments of primary interest start at Level 1.</li>
          <li>If text remains after final truncation amount, a "continue reading" button will appear.</li>
        </ul>
        <p>
          See Advanced View for granular control.
        </p>
      </div>
      {showWarning && (
        <p className={classes.customWarningMessage}>
          Note: Some settings were customized in the Advanced view. Saving from the Simple view will overrwrite them.
        </p>
      )}
      <div className={classes.truncationGridContainer}>
        <div />
        <div className={classes.truncationGridHeader}>Posts</div>
        <div className={classes.truncationGridHeader}>Comments</div>
        
        {breakpointErrorDisplay}

        <div className={classes.truncationGridRowHeader}>Level 0</div>
        <TruncationLevelDropdown field="postLevel0" value={levels.postLevel0} onChange={onChange} />
        <TruncationLevelDropdown field="commentLevel0" value={levels.commentLevel0} onChange={onChange} />

        <div className={classes.truncationGridRowHeader}>Level 1</div>
        <TruncationLevelDropdown field="postLevel1" value={levels.postLevel1} onChange={onChange} />
        <TruncationLevelDropdown field="commentLevel1" value={levels.commentLevel1} onChange={onChange} />

        <div className={classes.truncationGridRowHeader}>Level 2</div>
        <TruncationLevelDropdown field="postLevel2" value={levels.postLevel2} onChange={onChange} />
        <TruncationLevelDropdown field="commentLevel2" value={levels.commentLevel2} onChange={onChange} />
      </div>
    </CollapsibleSettingGroup>
  );
};

type ArrayFieldError = ZodFormattedError<(number | null)[] | undefined, string> & {
  [k: number]: ZodFormattedError<number | null, string>;
};

export interface AdvancedTruncationSettingsProps {
  values: {
    lineClampNumberOfLines: number | '';
    postTruncationBreakpoints: (number | '')[];
    commentTruncationBreakpoints: (number | '')[];
  };
  errors: {
    lineClampNumberOfLines?: string;
    postTruncationBreakpoints?: ZodFormattedError<number[], string>;
    commentTruncationBreakpoints?: ZodFormattedError<number[], string>;
  };
  onLineClampChange: (value: number | string) => void;
  onBreakpointChange: (kind: 'post' | 'comment', index: number, value: string | number) => void;
  defaultOpen?: boolean;
}

export const AdvancedTruncationSettings: React.FC<AdvancedTruncationSettingsProps> = ({
  values,
  errors,
  onLineClampChange,
  onBreakpointChange,
  defaultOpen = true,
}) => {
  const classes = useStyles(styles);

  // Returns the first validation error for the given breakpoint index, falling back
  // to an array-level error if there is none for the specific element.
  const getBreakpointError = (
    kind: 'post' | 'comment',
    index: number,
  ): string | undefined => {
    const err = (kind === 'post'
      ? errors.postTruncationBreakpoints
      : errors.commentTruncationBreakpoints) as ArrayFieldError | undefined;

    return err?.[index]?._errors?.[0] ?? err?._errors?.[0];
  };
  
  const createBreakpointInputProps = (kind: 'post' | 'comment', index: number) => ({
    kind,
    index,
    value: kind === 'post' ? values.postTruncationBreakpoints[index] : values.commentTruncationBreakpoints[index],
    errorMessage: getBreakpointError(kind, index),
    onChange: onBreakpointChange,
    disabled: kind === 'comment' && index === 0 && values.lineClampNumberOfLines !== 0 && values.lineClampNumberOfLines !== '',
  });

  return (
    <CollapsibleSettingGroup title="Advanced Truncation" defaultOpen={defaultOpen} className={classes.settingGroup}>
      <p className={classes.groupDescription}>
        Fine-tune content truncation with precise word counts. Empty values are treated as "no truncation". 
      </p>
      
      <div className={classes.truncationGridContainer}>
        <div />
        <div className={classes.truncationGridHeader}>Posts</div>
        <div className={classes.truncationGridHeader}>Comments</div>

        <div className={classes.truncationGridRowHeader}>Line Clamp</div>
        <div className={classes.truncationGridCell} />
        <div className={classes.truncationGridCell}>
          <input
            type="number"
            className={classNames(classes.sourceWeightInput, {
              [classes.invalidInput]: !!errors.lineClampNumberOfLines
            })}
            value={values.lineClampNumberOfLines}
            onChange={(e) => onLineClampChange(e.target.value)}
            min={0}
            max={10}
            step={1}
          />
        </div>
        {errors.lineClampNumberOfLines && (
          <p id="lineclamp-error" className={classes.errorMessage} style={{gridColumn: '3 / span 1'}}>
            {errors.lineClampNumberOfLines}
          </p>
        )}

        <div className={classes.truncationGridRowHeader}>Level 0</div>
        <BreakpointInput {...createBreakpointInputProps('post', 0)} />
        <BreakpointInput {...createBreakpointInputProps('comment', 0)} />

        <div className={classes.truncationGridRowHeader}>Level 1</div>
        <BreakpointInput {...createBreakpointInputProps('post', 1)} />
        <BreakpointInput {...createBreakpointInputProps('comment', 1)} />

        <div className={classes.truncationGridRowHeader}>Level 2</div>
        <BreakpointInput {...createBreakpointInputProps('post', 2)} />
        <BreakpointInput {...createBreakpointInputProps('comment', 2)} />
      </div>

      {values.lineClampNumberOfLines !== 0 && (
        <p className={classes.groupDescription} style={{marginTop: 8}}>
          When line clamp is non-zero, comments at Level 0 are truncated based on number of lines.
        </p>
      )}

      {errors.postTruncationBreakpoints?._errors?.[0] && !getBreakpointError('post', 0) && !getBreakpointError('post', 1) && !getBreakpointError('post', 2) && (
        <p className={classes.errorMessage}>{errors.postTruncationBreakpoints._errors[0]}</p>
      )}
      {errors.commentTruncationBreakpoints?._errors?.[0] && !getBreakpointError('comment', 0) && !getBreakpointError('comment', 1) && !getBreakpointError('comment', 2) && (
        <p className={classes.errorMessage}>{errors.commentTruncationBreakpoints._errors[0]}</p>
      )}
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
      <p className={classes.groupDescription} style={{marginTop: 0, marginBottom: 16}}>
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
      <p className={classes.groupDescription} style={{marginTop: 0, marginBottom: 0}}>
        When enabled, the feed algorithm does not log viewing behavior (votes and comments will still influence it). This does not disable standard LessWrong analytics separate from the feed.
      </p>

    </CollapsibleSettingGroup>
  );
};
