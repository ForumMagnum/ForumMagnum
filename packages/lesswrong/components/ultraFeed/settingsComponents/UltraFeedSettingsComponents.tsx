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
import { registerComponent, Components } from '../../../lib/vulcan-lib/components';
import { ZodFormattedError } from 'zod';

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
  // Styles for Truncation Grid
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
}));

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
}

const SourceWeightsSettings: React.FC<SourceWeightsSettingsProps> = ({
  weights,
  errors,
  onChange,
}) => {
  const classes = useStyles(styles);
  return (
    <div className={classes.settingGroup}>
      <h3 className={classes.groupTitle}>Source Weights</h3>
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
    </div>
  );
};
const SourceWeightsSettingsComponent = registerComponent('SourceWeightsSettings', SourceWeightsSettings);

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

interface TruncationGridSettingsProps {
  levels: SimpleViewTruncationLevels;
  onChange: (field: keyof SimpleViewTruncationLevels, value: TruncationLevel) => void;
  originalSettings: UltraFeedSettingsType;
}

const TruncationGridSettings: React.FC<TruncationGridSettingsProps> = ({
  levels,
  onChange,
  originalSettings,
}) => {
  const classes = useStyles(styles);
  const showWarning = checkMismatch(originalSettings);

  return (
    <div className={classes.settingGroup}>
      <h3 className={classes.groupTitle}>Content Display Length</h3>
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
    </div>
  );
};

const TruncationGridSettingsComponent = registerComponent('TruncationGridSettings', TruncationGridSettings);

type ArrayFieldError = ZodFormattedError<(number | null)[] | undefined, string> & {
  [k: number]: ZodFormattedError<number | null, string>;
};

interface AdvancedTruncationSettingsProps {
  values: {
    lineClampNumberOfLines: number | '';
    postBreakpoints: (number | null | '')[];
    commentBreakpoints: (number | null | '')[];
  };
  errors: {
    lineClampNumberOfLines?: string;
    postBreakpoints?: ZodFormattedError<(number | null)[] | undefined, string>;
    commentBreakpoints?: ZodFormattedError<(number | null)[] | undefined, string>;
  };
  onLineClampChange: (value: number | string) => void;
  onBreakpointChange: (kind: 'post' | 'comment', index: number, value: string | number | null) => void;
}

const AdvancedTruncationSettings: React.FC<AdvancedTruncationSettingsProps> = ({
  values,
  errors,
  onLineClampChange,
  onBreakpointChange,
}) => {
  const classes = useStyles(styles);

  // Returns the first validation error for the given breakpoint index, falling back
  // to an array-level error if there is none for the specific element.
  const getBreakpointError = (
    kind: 'post' | 'comment',
    index: number,
  ): string | undefined => {
    const err = (kind === 'post'
      ? errors.postBreakpoints
      : errors.commentBreakpoints) as ArrayFieldError | undefined;

    return err?.[index]?._errors?.[0] ?? err?._errors?.[0];
  };
  
  const createBreakpointInputProps = (kind: 'post' | 'comment', index: number) => ({
    kind,
    index,
    value: kind === 'post' ? values.postBreakpoints[index] : values.commentBreakpoints[index],
    errorMessage: getBreakpointError(kind, index),
    onChange: onBreakpointChange,
    disabled: kind === 'comment' && index === 0 && values.lineClampNumberOfLines !== 0 && values.lineClampNumberOfLines !== '',
  });

  return (
    <div className={classes.settingGroup}>
      <h3 className={classes.groupTitle}>Advanced Truncation</h3>
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

      {errors.postBreakpoints?._errors?.[0] && !getBreakpointError('post', 0) && !getBreakpointError('post', 1) && !getBreakpointError('post', 2) && (
        <p className={classes.errorMessage}>{errors.postBreakpoints._errors[0]}</p>
      )}
      {errors.commentBreakpoints?._errors?.[0] && !getBreakpointError('comment', 0) && !getBreakpointError('comment', 1) && !getBreakpointError('comment', 2) && (
        <p className={classes.errorMessage}>{errors.commentBreakpoints._errors[0]}</p>
      )}
    </div>
  );
};
const AdvancedTruncationSettingsComponent = registerComponent('AdvancedTruncationSettings', AdvancedTruncationSettings);

interface MultipliersSettingsProps {
  formValues: CommentScoringFormState;
  errors: ZodFormattedError<CommentScoringFormState, string> | null;
  onFieldChange: (field: keyof CommentScoringFormState, value: number | string) => void;
}

const MultipliersSettings: React.FC<MultipliersSettingsProps> = ({
  formValues, 
  errors,
  onFieldChange,
}) => {
  const classes = useStyles(styles);

  const defaultCommentScoringSettings = DEFAULT_SETTINGS.resolverSettings.commentScoring;

  const quickTakeBoostSliderValue = typeof formValues.quickTakeBoost === 'number' ? formValues.quickTakeBoost : defaultCommentScoringSettings.quickTakeBoost;
  const subscribedAuthorSliderValue = typeof formValues.commentSubscribedAuthorMultiplier === 'number' ? formValues.commentSubscribedAuthorMultiplier : defaultCommentScoringSettings.commentSubscribedAuthorMultiplier;
  const seenPenaltySliderValue = typeof formValues.ultraFeedSeenPenalty === 'number' ? formValues.ultraFeedSeenPenalty : defaultCommentScoringSettings.ultraFeedSeenPenalty;
  const commentDecayFactorSliderValue = typeof formValues.commentDecayFactor === 'number' ? formValues.commentDecayFactor : defaultCommentScoringSettings.commentDecayFactor;
  const commentDecayBiasHoursSliderValue = typeof formValues.commentDecayBiasHours === 'number' ? formValues.commentDecayBiasHours : defaultCommentScoringSettings.commentDecayBiasHours;
  const threadScoreFirstNSliderValue = typeof formValues.threadScoreFirstN === 'number' ? formValues.threadScoreFirstN : defaultCommentScoringSettings.threadScoreFirstN;

  const quickTakeBoost = {
    value: formValues.quickTakeBoost,
    error: errors?.quickTakeBoost?._errors[0],
    onChange: (val: number | string) => onFieldChange('quickTakeBoost', val),
  };
  const seenPenalty = {
    value: formValues.ultraFeedSeenPenalty,
    error: errors?.ultraFeedSeenPenalty?._errors[0],
    onChange: (val: number | string) => onFieldChange('ultraFeedSeenPenalty', val),
  };
  const commentSubscribedAuthorMultiplier = {
    value: formValues.commentSubscribedAuthorMultiplier,
    error: errors?.commentSubscribedAuthorMultiplier?._errors[0],
    onChange: (val: number | string) => onFieldChange('commentSubscribedAuthorMultiplier', val),
  };
  const commentDecayFactor = {
    value: formValues.commentDecayFactor,
    error: errors?.commentDecayFactor?._errors[0],
    onChange: (val: number | string) => onFieldChange('commentDecayFactor', val),
  };
  const commentDecayBiasHours = {
    value: formValues.commentDecayBiasHours,
    error: errors?.commentDecayBiasHours?._errors[0],
    onChange: (val: number | string) => onFieldChange('commentDecayBiasHours', val),
  };
  const threadScoreFirstN = {
    value: formValues.threadScoreFirstN,
    error: errors?.threadScoreFirstN?._errors[0],
    onChange: (val: number | string) => onFieldChange('threadScoreFirstN', val),
  };
  const threadScoreAggregation = {
    value: formValues.threadScoreAggregation,
    error: errors?.threadScoreAggregation?._errors[0],
    onChange: (val: string) => onFieldChange('threadScoreAggregation', val),
  };

  return (
    <div className={classes.settingGroup}>
      <h3 className={classes.groupTitle}>Comment Scoring (1/2)</h3>
      <div className={classes.groupDescription}>
        <p className={classes.formulaDescription}>
          <code>timeDecayedKarma = ((karma + 1) / (ageHours + commentDecayBiasHours)^(commentDecayFactor))</code><br/>
          <code>individualCommentScore = timeDecayedKarma * quickTakeBoost * subscribedMultiplier * seenPenalty</code><br/>
          <code>baseThreadScore = aggregateMethod(firstN(individualCommentScore))</code>
        </p>
      </div>


      <div className={classes.sourceWeightItem}>
        <div className={classes.sourceWeightContainer}>
          <label className={classes.sourceWeightLabel}>Quick Take Boost</label>
          <Slider
            className={classes.sourceWeightSlider}
            value={quickTakeBoostSliderValue}
            onChange={(_, val) => quickTakeBoost.onChange(val as number)}
            min={0.5}
            max={3.0}
            step={0.01}
          />
          <input
            type="number"
            className={classNames(classes.sourceWeightInput, {
              [classes.invalidInput]: !!quickTakeBoost.error
            })}
            value={quickTakeBoost.value}
            onChange={(e) => quickTakeBoost.onChange(e.target.value)}
            min={0.5}
            max={3.0}
            step={0.01}
          />
        </div>
        <p className={classes.sourceWeightDescription}>Multiplier applied to the score of Quick Takes comments.</p>
        {quickTakeBoost.error && (
          <p className={classes.errorMessage}>{quickTakeBoost.error}</p>
        )}
      </div>

      <div className={classes.sourceWeightItem}>
        <div className={classes.sourceWeightContainer}>
          <label className={classes.sourceWeightLabel}>Subscribed Boost</label>
          <Slider
            className={classes.sourceWeightSlider}
            value={subscribedAuthorSliderValue}
            onChange={(_, val) => commentSubscribedAuthorMultiplier.onChange(val as number)}
            min={1}
            max={5}
            step={0.1}
          />
          <input
            type="number"
            className={classNames(classes.sourceWeightInput, {
              [classes.invalidInput]: !!commentSubscribedAuthorMultiplier.error
            })}
            value={commentSubscribedAuthorMultiplier.value}
            onChange={(e) => commentSubscribedAuthorMultiplier.onChange(e.target.value)}
            min={1}
            max={5}
            step={0.1}
          />
        </div>
        <p className={classes.sourceWeightDescription}>
          Multiplier for comments by authors you subscribe to or follow. Default: {DEFAULT_SETTINGS.resolverSettings.commentScoring.commentSubscribedAuthorMultiplier}
        </p>
        {commentSubscribedAuthorMultiplier.error && (
          <p className={classes.errorMessage}>{commentSubscribedAuthorMultiplier.error}</p>
        )}
      </div>

      <div className={classes.sourceWeightItem}>
        <div className={classes.sourceWeightContainer}>
          <label className={classes.sourceWeightLabel}>Seen Penalty</label>
          <Slider
            className={classes.sourceWeightSlider}
            value={seenPenaltySliderValue}
            onChange={(_, val) => seenPenalty.onChange(val as number)}
            min={0}
            max={1}
            step={0.01}
          />
          <input
            type="number"
            className={classNames(classes.sourceWeightInput, {
              [classes.invalidInput]: !!seenPenalty.error
            })}
            value={seenPenalty.value}
            onChange={(e) => seenPenalty.onChange(e.target.value)}
            min={0}
            max={1}
            step={0.01}
          />
        </div>
        <p className={classes.sourceWeightDescription}>
          Score multiplier for items already marked as seen (0 to 1). Default: {DEFAULT_SETTINGS.resolverSettings.commentScoring.ultraFeedSeenPenalty}
        </p>
        {seenPenalty.error && (
          <p className={classes.errorMessage}>{seenPenalty.error}</p>
        )}
      </div>

      <div className={classes.sourceWeightItem}>
        <div className={classes.sourceWeightContainer}>
          <label className={classes.sourceWeightLabel}>Decay Factor</label>
          <Slider
            className={classes.sourceWeightSlider}
            value={commentDecayFactorSliderValue}
            onChange={(_, val) => commentDecayFactor.onChange(val as number)}
            min={1.0}
            max={2.5}
            step={0.1}
          />
          <input
            type="number"
            className={classNames(classes.sourceWeightInput, {
              [classes.invalidInput]: !!commentDecayFactor.error
            })}
            value={commentDecayFactor.value}
            onChange={(e) => commentDecayFactor.onChange(e.target.value)}
            min={1.0}
            max={2.5}
            step={0.1}
          />
        </div>
        <p className={classes.sourceWeightDescription}>
          Controls how quickly comments lose score over time. Higher values mean faster decay. Default: {DEFAULT_SETTINGS.resolverSettings.commentScoring.commentDecayFactor}
        </p>
        {commentDecayFactor.error && (
          <p className={classes.errorMessage}>{commentDecayFactor.error}</p>
        )}
      </div>

      <div className={classes.sourceWeightItem}>
        <div className={classes.sourceWeightContainer}>
          <label className={classes.sourceWeightLabel}>Decay Bias (hours)</label>
          <Slider
            className={classes.sourceWeightSlider}
            value={commentDecayBiasHoursSliderValue}
            onChange={(_, val) => commentDecayBiasHours.onChange(val as number)}
            min={0}
            max={8}
            step={0.5}
          />
          <input
            type="number"
            className={classNames(classes.sourceWeightInput, {
              [classes.invalidInput]: !!commentDecayBiasHours.error
            })}
            value={commentDecayBiasHours.value}
            onChange={(e) => commentDecayBiasHours.onChange(e.target.value)}
            min={0}
            max={8}
            step={0.5}
          />
        </div>
        <p className={classes.sourceWeightDescription}>
          Hours to add to comment age for decay calculation. Higher values give newer comments a boost. Default: {DEFAULT_SETTINGS.resolverSettings.commentScoring.commentDecayBiasHours}
        </p>
        {commentDecayBiasHours.error && (
          <p className={classes.errorMessage}>{commentDecayBiasHours.error}</p>
        )}
      </div>

      <div className={classes.sourceWeightItem}>
        <div className={classes.sourceWeightContainer}>
          <label className={classes.sourceWeightLabel}>Thread First N</label>
          <Slider
            className={classes.sourceWeightSlider}
            value={threadScoreFirstNSliderValue}
            onChange={(_, val) => threadScoreFirstN.onChange(val as number)}
            min={1}
            max={20}
            step={1}
          />
          <input
            type="number"
            className={classNames(classes.sourceWeightInput, {
              [classes.invalidInput]: !!threadScoreFirstN.error
            })}
            value={threadScoreFirstN.value}
            onChange={(e) => threadScoreFirstN.onChange(e.target.value)}
            min={1}
            max={20}
            step={1}
          />
        </div>
        <p className={classes.sourceWeightDescription}>
          Number of top comments to consider when calculating thread score. Default: {DEFAULT_SETTINGS.resolverSettings.commentScoring.threadScoreFirstN}
        </p>
        {threadScoreFirstN.error && (
          <p className={classes.errorMessage}>{threadScoreFirstN.error}</p>
        )}
      </div>

      <div className={classes.sourceWeightItem}>
        <div className={classes.sourceWeightContainer}>
          <label className={classes.sourceWeightLabel}>Thread Agg.</label>
          <select
            className={classNames(classes.sourceWeightInput, classes.threadAggSelect, { [classes.invalidInput]: !!threadScoreAggregation.error })}
            value={threadScoreAggregation.value}
            onChange={(e) => threadScoreAggregation.onChange(e.target.value)}
          >
            <option value="sum">Sum</option>
            <option value="max">Max</option>
            <option value="logSum">Log Sum</option>
            <option value="avg">Average</option>
          </select>
        </div>
        <p className={classes.sourceWeightDescription}>
          How to aggregate comment scores into a thread score. Default: {DEFAULT_SETTINGS.resolverSettings.commentScoring.threadScoreAggregation}
        </p>
        {threadScoreAggregation.error && (
          <p className={classes.errorMessage}>{threadScoreAggregation.error}</p>
        )}
      </div>
    </div>
  );
};
const MultipliersSettingsComponent = registerComponent('MultipliersSettings', MultipliersSettings);

interface ThreadInterestTuningSettingsProps {
  formValues: ThreadInterestModelFormState;
  errors: ZodFormattedError<ThreadInterestModelFormState, string> | null;
  onFieldChange: (field: keyof ThreadInterestModelFormState, value: number | string) => void;
}

const ThreadInterestTuningSettings: React.FC<ThreadInterestTuningSettingsProps> = ({
  formValues,
  errors,
  onFieldChange,
}) => {
  const classes = useStyles(styles);

  const defaultThreadInterestModelSettings = DEFAULT_SETTINGS.resolverSettings.threadInterestModel;

  const fields = [
    {
      key: 'commentCoeff' as const,
      label: "Comment Coefficient",
      description: "How much each comment you have in a thread contributes to further activity in that thread being shown.",
      min: 0, max: 0.5, step: 0.01, defaultVal: defaultThreadInterestModelSettings.commentCoeff,
    },
    {
      key: 'voteCoeff' as const,
      label: "Vote Coefficient",
      description: "How much each vote you have in a thread contributes to further activity in that thread being shown.",
      min: 0, max: 0.2, step: 0.005, defaultVal: defaultThreadInterestModelSettings.voteCoeff,
    },
    {
      key: 'viewCoeff' as const,
      label: "View Coefficient",
      description: "How much viewing (and especially expanding) an item contributes to further activity in a thread being shown.",
      min: 0, max: 0.1, step: 0.005, defaultVal: defaultThreadInterestModelSettings.viewCoeff,
    },
    {
      key: 'onReadPostFactor' as const,
      label: "Read Post Factor",
      description: "Multiplier if the thread is on a post a user has read.",
      min: 0.5, max: 2.0, step: 0.05, defaultVal: defaultThreadInterestModelSettings.onReadPostFactor,
    },
    {
      key: 'logImpactFactor' as const,
      label: "Log Impact Factor",
      description: "Scales the effect of the combined log-of-factors on the final multiplier (Multiplier = 1 + LogOfFactors * Impact).",
      min: 0.01, max: 1.0, step: 0.01, defaultVal: defaultThreadInterestModelSettings.logImpactFactor,
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
      description: "The maximum final multiplier applied to the thread's base score (e.g., 2.0 for max 100% boost).",
      min: 1.0, max: 20.0, step: 0.1, defaultVal: defaultThreadInterestModelSettings.maxOverallMultiplier,
    },
  ];

  return (
    <div className={classes.settingGroup}>
      <h3 className={classes.groupTitle}>Comment Thread Multipliers (2/2)</h3>
      <div className={classes.groupDescription}>
        <p className={classes.formulaDescription}>
          <code>engagementFactor = (1+commentCoeff*numComments) * (1+voteCoeff*voteScore) * (1+viewCoeff*viewScore) * onReadPostFactor</code><br/>
          <code>threadMultiplier = 1 + log(engagementFactor) * logImpactFactor</code><br/>
          <code>clampedThreadMultiplier = clamped(threadMultiplier, minOverallMultiplier, maxOverallMultiplier)</code><br/><br/>
          <code>overallThreadScore = baseThreadScore * clampedThreadMultiplier</code>
        </p>
        <p>
          <ul>
            <li>See Comment Scoring section for calculation of baseThreadScore</li>
            <li>voteScore: smallUpvotes = 1 vote unit, bigUpovtes = 5</li>
            <li>viewScore: itemOnViewport = 1 view unit, itemExpanded = 3 view units</li>
            <li>onReadPostFactor applies if thread is on a post user has read, otherwise 1.0</li>
          </ul>
        </p>
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
                aria-labelledby={`${f.key}-label`}
              />
              <input
                type="number"
                className={classNames(classes.sourceWeightInput, { [classes.invalidInput]: !!currentError })}
                value={currentValue} // Keep as number | '' for input field
                onChange={(e) => onFieldChange(f.key, e.target.value)}
                min={f.min}
                max={f.max}
                step={f.step}
                aria-describedby={currentError ? `${f.key}-error` : undefined}
              />
            </div>
            <p id={`${f.key}-label`} className={classes.sourceWeightDescription}>{f.description} Default: {f.defaultVal}</p>
            {currentError && <p id={`${f.key}-error`} className={classes.errorMessage}>{currentError}</p>}
          </div>
        );
      })}
    </div>
  );
};

const ThreadInterestTuningSettingsComponent = registerComponent('ThreadInterestTuningSettings', ThreadInterestTuningSettings);

interface MiscSettingsProps {
  formValues: {
    incognitoMode: boolean;
    postTitlesAreModals: boolean;
  };
  onBooleanChange: (field: 'postTitlesAreModals' | 'incognitoMode', checked: boolean) => void;
}

const MiscSettings: React.FC<MiscSettingsProps> = ({ formValues, onBooleanChange }) => {
  const classes = useStyles(styles);
  return (
    <div className={classes.settingGroup}>
      <h3 className={classes.groupTitle}>Misc</h3>
      
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

    </div>
  );
};
const MiscSettingsComponent = registerComponent('MiscSettings', MiscSettings);
export default TruncationGridSettingsComponent; // one export required to make Vite HMR work

declare global {
  interface ComponentTypes {
    SourceWeightsSettings: typeof SourceWeightsSettingsComponent
    TruncationGridSettings: typeof TruncationGridSettingsComponent
    AdvancedTruncationSettings: typeof AdvancedTruncationSettingsComponent
    MultipliersSettings: typeof MultipliersSettingsComponent
    ThreadInterestTuningSettings: typeof ThreadInterestTuningSettingsComponent
    MiscSettings: typeof MiscSettingsComponent
  }
}
