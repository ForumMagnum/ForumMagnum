import React from 'react';
import classNames from 'classnames';
import { useStyles, defineStyles } from '../../hooks/useStyles';
import { 
  TruncationLevel, 
  UltraFeedSettingsType,
  SettingsFormState,
  sourceWeightConfigs,
  truncationLevels,
  levelToCommentLinesMap,
  levelToCommentBreakpointMap,
  levelToPostBreakpointMap,
  DEFAULT_SETTINGS
} from '../ultraFeedSettingsTypes';
import { FeedItemSourceType } from '../ultraFeedTypes';
import Slider from '@/lib/vendor/@material-ui/core/src/Slider';
import Checkbox from '@/lib/vendor/@material-ui/core/src/Checkbox';
import { useTracking } from '@/lib/analyticsEvents';
import { registerComponent, Components } from '../../../lib/vulcan-lib/components';
import { ZodFormattedError } from 'zod';

const styles = defineStyles('UltraFeedSettingsComponents', (theme: ThemeType) => ({
  settingGroup: {
    marginBottom: 12,
    padding: 16,
    border: `1px solid ${theme.palette.grey[300]}`,
    borderRadius: 4,
  },
  groupTitle: {
    fontSize: '1.2rem',
    fontWeight: 600,
    marginBottom: 8,
    fontFamily: 'inherit',
  },
  groupDescription: {
    marginBottom: 16,
    color: theme.palette.text.dim,
    fontSize: '0.9rem',
    fontFamily: 'inherit',
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
    fontSize: '0.95rem',
    width: 140,
    flexShrink: 0,
  },
  sourceWeightDescription: {
    fontSize: '0.85rem',
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
  lineClampLabel: {
    fontSize: '0.90rem',
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
    fontSize: '0.8rem',
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
    fontSize: '0.9rem',
    padding: 8,
  },
  truncationGridRowHeader: {
    fontWeight: 600,
    textAlign: 'right',
    fontSize: '0.9rem',
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
    fontSize: '0.9rem',
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
    fontSize: '0.9rem',
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
    fontSize: '0.95rem',
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

interface TruncationLevelDropdownProps {
  field: TruncationGridFields;
  value: TruncationLevel;
  onChange: (field: TruncationGridFields, value: TruncationLevel) => void;
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

type TruncationGridFields = 'postLevel0' | 'postLevel1' | 'postLevel2' | 'commentLevel0' | 'commentLevel1' | 'commentLevel2';
interface TruncationGridSettingsProps {
  levels: Pick<SettingsFormState, TruncationGridFields>;
  onChange: (field: TruncationGridFields, value: TruncationLevel) => void;
  originalSettings: UltraFeedSettingsType;
}

const TruncationGridSettings: React.FC<TruncationGridSettingsProps> = ({
  levels,
  onChange,
  originalSettings,
}) => {
  const classes = useStyles(styles);

  const checkMismatch = () => {
    const allowedLineClamps = new Set(Object.values(levelToCommentLinesMap)); // {0,2}
    const allowedCommentValues = new Set( Object.values(levelToCommentBreakpointMap).filter(v => v !== undefined));
    const allowedPostValues = new Set(Object.values(levelToPostBreakpointMap).filter(v => v !== undefined));

    const arrayHasUnsupported = (
      arr: (number | null | undefined)[] | undefined,
      allowed: Set<number | null>
    ) => {
      if (!arr) return false;
      if (arr.length > 3) return true;
      return arr.some(v => !allowed.has(v === undefined ? undefined as any : v));
    };

    if (!allowedLineClamps.has(originalSettings.lineClampNumberOfLines)) return true;

    if (arrayHasUnsupported(originalSettings.commentTruncationBreakpoints, allowedCommentValues)) return true;
    if (arrayHasUnsupported(originalSettings.postTruncationBreakpoints, allowedPostValues)) return true;

    return false;
  };

  const showWarning = checkMismatch();

  return (
    <div className={classes.settingGroup}>
      <h3 className={classes.groupTitle}>Content Display Length</h3>
      <p className={classes.groupDescription}>
        Choose how much content to show for posts and comments.
      </p>
      <ul>
        <li>Deemphasized comments start at Level 0. Comments of primary interest start at Level 1.</li>
        <li>If text remains after final truncation amount, a "continue reading" button will appear.</li>
      </ul>
      <p>
        See Advanced View for granular control.
      </p>
        
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

interface AdvancedTruncationSettingsProps {
  values: {
    lineClampNumberOfLines: number | '';
    postBreakpoints: (number | null | '')[];
    commentBreakpoints: (number | null | '')[];
  };
  errors: {
    lineClampNumberOfLines?: string;
    postBreakpoints?: ZodFormattedError<(number | null)[]>;
    commentBreakpoints?: ZodFormattedError<(number | null)[]>;
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

  const getBreakpointError = (kind: 'post' | 'comment', index: number): string | undefined => {
    const errorObj = kind === 'post' ? errors.postBreakpoints : errors.commentBreakpoints;
    return errorObj?.[index]?._errors?.[0] || errorObj?._errors?.[0];
  };

  const createBreakpointInputProps = (kind: 'post' | 'comment', index: number) => ({
    kind,
    index,
    value: kind === 'post' ? values.postBreakpoints[index] : values.commentBreakpoints[index],
    errorMessage: getBreakpointError(kind, index),
    onChange: onBreakpointChange,
    disabled: kind === 'comment' && index === 0 && values.lineClampNumberOfLines !== 0,
  });


  return (
    <div className={classes.settingGroup}>
      <h3 className={classes.groupTitle}>Advanced Truncation</h3>
      <p className={classes.groupDescription}>
        Fine-tune content truncation with precise word counts. Empty values are treated as "no truncation". 
      </p>
      
      <div className={classes.truncationGridContainer}>
        <div />
        <div className={classes.truncationGridHeader}>Posts (words)</div>
        <div className={classes.truncationGridHeader}>Comments (words)</div>

        <div className={classes.truncationGridRowHeader}>Line&nbsp;Clamp</div>
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
            aria-invalid={!!errors.lineClampNumberOfLines}
            aria-describedby={errors.lineClampNumberOfLines ? `lineclamp-error` : undefined}
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
  quickTakeBoost: {
    value: number;
    error?: string;
    onChange: (value: number | string) => void;
  };
  seenPenalty: {
    value: number | '';
    error?: string;
    onChange: (value: number | string) => void;
  };
}

const MultipliersSettings: React.FC<MultipliersSettingsProps> = ({
  quickTakeBoost,
  seenPenalty,
}) => {
  const classes = useStyles(styles);
  return (
    <div className={classes.settingGroup}>
      <h3 className={classes.groupTitle}>Multipliers</h3>

      <div className={classes.sourceWeightItem}>
        <div className={classes.sourceWeightContainer}>
          <label className={classes.sourceWeightLabel}>Quick Take Boost</label>
          <Slider
            className={classes.sourceWeightSlider}
            value={quickTakeBoost.value}
            onChange={(_, val) => quickTakeBoost.onChange(val as number)}
            min={0.5}
            max={3.0}
            step={0.1}
          />
          <input
            type="number"
            className={classNames(classes.sourceWeightInput, {
              [classes.invalidInput]: !!quickTakeBoost.error
            })}
            value={quickTakeBoost.value}
            onChange={(e) => quickTakeBoost.onChange(parseFloat(e.target.value))}
            min={0.5}
            max={3.0}
            step={0.1}
          />
        </div>
        <p className={classes.sourceWeightDescription}>Multiplier applied to the score of Quick Takes comments.</p>
        {quickTakeBoost.error && (
          <p className={classes.errorMessage}>{quickTakeBoost.error}</p>
        )}
      </div>

      <div className={classes.sourceWeightItem}>
        <div className={classes.sourceWeightContainer}>
          <label className={classes.sourceWeightLabel}>Seen Penalty</label>
          <Slider
            className={classes.sourceWeightSlider}
            value={typeof seenPenalty.value === 'number' ? seenPenalty.value : 0}
            onChange={(_, val) => seenPenalty.onChange(val as number)}
            min={0}
            max={1}
            step={0.05}
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
            step={0.05}
          />
        </div>
        <p className={classes.sourceWeightDescription}>
          Score multiplier for items already marked as seen (0 to 1). Default: {DEFAULT_SETTINGS.ultraFeedSeenPenalty}
        </p>
        {seenPenalty.error && (
          <p className={classes.errorMessage}>{seenPenalty.error}</p>
        )}
      </div>
    </div>
  );
};
const MultipliersSettingsComponent = registerComponent('MultipliersSettings', MultipliersSettings);

interface MiscSettingsProps {
  formValues: Pick<SettingsFormState, 'postTitlesAreModals' | 'incognitoMode'>;
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
          Open Post Titles in Modals
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

declare global {
  interface ComponentTypes {
    SourceWeightsSettings: typeof SourceWeightsSettingsComponent
    TruncationGridSettings: typeof TruncationGridSettingsComponent
    AdvancedTruncationSettings: typeof AdvancedTruncationSettingsComponent
    MultipliersSettings: typeof MultipliersSettingsComponent
    MiscSettings: typeof MiscSettingsComponent
  }
}
