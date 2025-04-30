import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib/components';
import { UltraFeedSettingsType, DEFAULT_SOURCE_WEIGHTS, DEFAULT_SETTINGS } from './ultraFeedSettingsTypes';
import { FeedItemSourceType } from './ultraFeedTypes';
import { defineStyles, useStyles } from '../hooks/useStyles';
import classNames from 'classnames';
import { useTracking } from '@/lib/analyticsEvents';
import Slider from '@/lib/vendor/@material-ui/core/src/Slider';
import Checkbox from '@/lib/vendor/@material-ui/core/src/Checkbox';
import { useMessages } from '../common/withMessages';


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
    [theme.breakpoints.down('xs')]: {
      // fontSize: 13,
    }
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
  subsectionTitle: {
    fontSize: '1.0rem',
    fontWeight: 600,
    marginTop: theme.spacing.unit * 2.5,
    marginBottom: theme.spacing.unit * 1.5,
    borderTop: `1px solid ${theme.palette.grey[300]}`,
    paddingTop: theme.spacing.unit * 1.5,
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
  errorMessage: {
    color: theme.palette.error.main,
    fontSize: '0.8rem',
    marginTop: 4,
    textAlign: 'right',
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
    // backgroundColor: theme.palette.grey[400],
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
  truncationGridHeader: { // Now used for Column Headers (Posts, Comments)
    fontWeight: 600,
    textAlign: 'center',
    fontSize: '0.9rem',
    padding: 8,
  },
  truncationGridRowHeader: { // Now used for Row Headers (Initial, Expanded)
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
    fontSize: '0.85rem',
    color: theme.palette.warning.main,
    backgroundColor: theme.palette.grey[50],
    border: `1px solid ${theme.palette.warning.main}`,
    borderRadius: 4,
    padding: theme.spacing.unit,
    marginBottom: theme.spacing.unit * 2,
    marginTop: theme.spacing.unit,
  },
  // Styles for Advanced Truncation component
  subheading: {
    fontSize: '1rem',
    fontWeight: 500,
    marginTop: theme.spacing.unit * 2,
    marginBottom: theme.spacing.unit,
  },
  truncationBreakpointsSection: {
    marginTop: theme.spacing.unit * 2,
  },
  breakpointRow: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: theme.spacing.unit,
  },
  breakpointIndex: {
    width: 30,
    textAlign: 'right',
    paddingRight: theme.spacing.unit,
    fontFamily: 'monospace',
  },
  removeButton: {
    border: 'none',
    background: 'none',
    color: theme.palette.error.main,
    fontSize: '1.2rem',
    cursor: 'pointer',
    padding: '0 8px',
    '&:hover': {
      color: theme.palette.error.dark,
    }
  },
  addButton: {
    border: `1px solid ${theme.palette.primary.main}`,
    borderRadius: 4,
    background: 'none',
    color: theme.palette.primary.main,
    padding: '4px 8px',
    cursor: 'pointer',
    marginTop: theme.spacing.unit,
    '&:hover': {
      backgroundColor: theme.palette.grey[100],
    }
  },
  // Styles for Checkbox
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
interface SourceWeightConfig {
  key: FeedItemSourceType;
  label: string;
  description: string;
}

const sourceWeightConfigs: SourceWeightConfig[] = [
  {
    key: 'recombee-lesswrong-custom',
    label: "Personalized Post Recs",
    description: "Tailored for you based on your reading and voting history."
  },
  {
    key: 'hacker-news',
    label: "Latest Posts",
    description: "Prioritized by karma and your personalized frontpage settings."
  },
  {
    key: 'spotlights',
    label: "Featured Items",
    description: "Manually curated items highlighted by moderators or editors."
  },
  {
    key: 'bookmarks',
    label: "Your Bookmarks",
    description: "Items you've bookmarked will be included to remind you about them."
  },
  {
    key: 'recentComments',
    label: "Recent Comments",
    description: "Tailored for you based on interaction history, includes Quick Takes."
  },
];

export const truncationLevels = ['Very Short', 'Short', 'Medium', 'Long', 'Full', 'Unset'] as const;
export type TruncationLevel = typeof truncationLevels[number];

// We define valid default breakpoints to ensure that default settings (ultrafeedSettingTypes.ts) always map to valid "simple" settings
const validDefaultPostBreakpoints = [50, 100, 200, 2000] as const;
const validDefaultCommentBreakpoints = [50, 100, 200, 1000] as const;
export type ValidDefaultPostBreakpoint = typeof validDefaultPostBreakpoints[number];
export type ValidDefaultCommentBreakpoint = typeof validDefaultCommentBreakpoints[number];

const levelToCommentLinesMap: Record<TruncationLevel, number> = {
  'Very Short': 2, // Only this sets a line clamp
  'Short': 0,      // Others disable line clamp
  'Medium': 0,
  'Long': 0,
  'Full': 0,
  'Unset': 0,
};

const levelToCommentBreakpointMap: Record<TruncationLevel, ValidDefaultCommentBreakpoint | null | undefined> = {
  'Very Short': 50,
  'Short': 100,
  'Medium': 200,
  'Long': 1000,
  'Full': null,       // explicit "show all"
  'Unset': undefined  // not present
};

const levelToPostBreakpointMap: Record<TruncationLevel, ValidDefaultPostBreakpoint | null | undefined> = {
  'Very Short': 50,
  'Short': 100,
  'Medium': 200,
  'Long': 2000,
  'Full': null,       // explicit "show all"
  'Unset': undefined  // not present
};

const getCommentLevelFromLines = (lines: number): TruncationLevel => {
  if (lines === 2) {
     return 'Very Short';
  }
  // If lines are 0 (disabled) or any other value (likely set via Advanced),
  // map back to 'Full' in the simple view, as other levels now mean lineClamp=0.
  return 'Full';
};

// Helper for COMMENT breakpoints
const getCommentBreakpointLevel = (breakpoint: number | null | undefined): TruncationLevel => {
  if (breakpoint === null) return 'Full';
  if (breakpoint === undefined) return 'Unset';
  if (breakpoint <= 0) return 'Full';
  
  let closestLevel: TruncationLevel = 'Very Short';
  let minDiff = Infinity;
  for (const level of truncationLevels) {
    if (level === 'Full' || level === 'Unset') continue;
    const mapVal = levelToCommentBreakpointMap[level]; // Use comment map
    if (mapVal === undefined || mapVal === null) continue;
    const diff = Math.abs(mapVal - breakpoint);
     if (diff < minDiff) {
       minDiff = diff;
       closestLevel = level;
     } else if (diff === minDiff && levelToCommentBreakpointMap[level]! > levelToCommentBreakpointMap[closestLevel]!) {
       closestLevel = level;
    }
  }
  return closestLevel;
};

// Helper for POST breakpoints
const getPostBreakpointLevel = (breakpoint: number | null | undefined): TruncationLevel => {
  if (breakpoint === null) return 'Full';
  if (breakpoint === undefined) return 'Unset';
  if (breakpoint <= 0) return 'Full';
  
  let closestLevel: TruncationLevel = 'Very Short';
  let minDiff = Infinity;
  for (const level of truncationLevels) {
    if (level === 'Full' || level === 'Unset') continue;
    const mapVal = levelToPostBreakpointMap[level]; // Use post map
    if (mapVal === undefined || mapVal === null) continue;
    const diff = Math.abs(mapVal - breakpoint);
    if (diff < minDiff) {
       minDiff = diff;
       closestLevel = level;
     } else if (diff === minDiff && levelToPostBreakpointMap[level]! > levelToPostBreakpointMap[closestLevel]!) {
       closestLevel = level;
    }
  }
  return closestLevel;
};
interface SettingsFormState {
  sourceWeights: Record<FeedItemSourceType, number | ''>;
  postLevel0: TruncationLevel;
  postLevel1: TruncationLevel;
  postLevel2: TruncationLevel;
  commentLevel0: TruncationLevel;
  commentLevel1: TruncationLevel;
  commentLevel2: TruncationLevel;
  incognitoMode: boolean;
  quickTakeBoost: number;
  // Advanced truncation settings
  lineClampNumberOfLines: number | '';
  postBreakpoints: (number | null | '')[];
  commentBreakpoints: (number | null | '')[];
  // Misc settings
  ultraFeedSeenPenalty: number | '';
  postTitlesAreModals: boolean;
}

interface SettingsFormErrors {
  sourceWeights: Record<FeedItemSourceType, boolean>;
  postLevel0?: boolean;
  postLevel1?: boolean;
  postLevel2?: boolean;
  commentLevel0?: boolean;
  commentLevel1?: boolean;
  commentLevel2?: boolean;
  quickTakeBoost?: boolean;
  // Advanced truncation errors
  lineClampNumberOfLines?: boolean;
  postBreakpoints?: boolean;
  commentBreakpoints?: boolean;
  // Misc errors
  ultraFeedSeenPenalty?: boolean;
}
interface SourceWeightsSettingsProps {
  weights: Record<FeedItemSourceType, number | ''>;
  errors: Record<FeedItemSourceType, boolean>;
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
        const hasError = errors[sourceKey];
        // Default slider to 0 if input is invalid/empty or undefined
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
                  [classes.invalidInput]: hasError
                })}
                value={currentValue}
                onChange={(e) => onChange(sourceKey, e.target.value)}
                min={0}
                max={100}
                step={5}
              />
            </div>
            <p className={classes.sourceWeightDescription}>{description}</p>
            {hasError && (
              <p className={classes.errorMessage}>Weight must be a non-negative number.</p>
            )}
          </div>
        );
      })}
    </div>
  );
};


type TruncationGridFields = 
  'postLevel0' | 'postLevel1' | 'postLevel2' |
  'commentLevel0' | 'commentLevel1' | 'commentLevel2';

interface TruncationGridSettingsProps {
  levels: Pick<SettingsFormState, 'postLevel0' | 'postLevel1' | 'postLevel2' | 'commentLevel0' | 'commentLevel1' | 'commentLevel2'>;
  onChange: (field: TruncationGridFields, value: TruncationLevel) => void;
  originalSettings: UltraFeedSettingsType;
}

const TruncationGridSettings: React.FC<TruncationGridSettingsProps> = ({
  levels,
  onChange,
  originalSettings,
}) => {
  const classes = useStyles(styles);
  const { captureEvent } = useTracking();

  // Format option labels with counts
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

  // Helper to render the dropdown for a specific field
  const renderDropdown = (field: TruncationGridFields) => {
    // Determine if this is a post or comment dropdown
    const isPostDropdown = field.startsWith('post');
    const getLabel = isPostDropdown ? getPostLevelLabel : getCommentLevelLabel;
    
    return (
      <select
        className={classes.truncationOptionSelect}
        value={levels[field]}
        onChange={(e) => onChange(field, e.target.value as TruncationLevel)}
      >
        {truncationLevels.map(levelOption => (
          <option key={levelOption} value={levelOption}>
            {getLabel(levelOption)}
          </option>
        ))}
      </select>
    );
  };

  // Check if the original numeric settings differ from what the current simple levels map to
  const checkMismatch = () => {
    const log = (msg: string) => {
      // eslint-disable-next-line no-console
      console.log(`[TruncationGridSettings mismatch] ${msg}`);
    };

    if (levelToCommentLinesMap[levels.commentLevel0] !== originalSettings.lineClampNumberOfLines) {
      log(`lineClampNumberOfLines mismatch: dropdown maps to ${levelToCommentLinesMap[levels.commentLevel0]}, stored is ${originalSettings.lineClampNumberOfLines}`);
      return true;
    }
    
    // Check comment breakpoints - each level against the corresponding bp index
    const commentBp1 = levelToCommentBreakpointMap[levels.commentLevel1];
    if (commentBp1 !== originalSettings.commentTruncationBreakpoints?.[1]) {
      log(`comment breakpoint[1] mismatch: dropdown ${commentBp1} vs stored ${originalSettings.commentTruncationBreakpoints?.[1]}`);
      return true;
    }
    
    const commentBp0 = levelToCommentBreakpointMap[levels.commentLevel0];
    if (originalSettings.commentTruncationBreakpoints?.[0] !== undefined &&
        commentBp0 !== originalSettings.commentTruncationBreakpoints?.[0]) {
      log(`comment breakpoint[0] mismatch: dropdown ${commentBp0} vs stored ${originalSettings.commentTruncationBreakpoints?.[0]}`);
      return true;
    }
    
    const commentBp2 = levelToCommentBreakpointMap[levels.commentLevel2];
    if (originalSettings.commentTruncationBreakpoints?.[2] !== undefined &&
        commentBp2 !== originalSettings.commentTruncationBreakpoints?.[2]) {
      log(`comment breakpoint[2] mismatch: dropdown ${commentBp2} vs stored ${originalSettings.commentTruncationBreakpoints?.[2]}`);
      return true;
    }
    
    // Also consider custom if >2 breakpoints defined
    if ((originalSettings.commentTruncationBreakpoints?.length ?? 0) > 3) return true;

    // Check post breakpoints - each level against the corresponding bp index
    if (levelToPostBreakpointMap[levels.postLevel0] !== originalSettings.postTruncationBreakpoints?.[0]) {
      log(`post breakpoint[0] mismatch: dropdown ${levelToPostBreakpointMap[levels.postLevel0]} vs stored ${originalSettings.postTruncationBreakpoints?.[0]}`);
      return true;
    }
    if (levelToPostBreakpointMap[levels.postLevel1] !== originalSettings.postTruncationBreakpoints?.[1]) {
      log(`post breakpoint[1] mismatch: dropdown ${levelToPostBreakpointMap[levels.postLevel1]} vs stored ${originalSettings.postTruncationBreakpoints?.[1]}`);
      return true;
    }
    if (levelToPostBreakpointMap[levels.postLevel2] !== originalSettings.postTruncationBreakpoints?.[2]) {
      log(`post breakpoint[2] mismatch: dropdown ${levelToPostBreakpointMap[levels.postLevel2]} vs stored ${originalSettings.postTruncationBreakpoints?.[2]}`);
      return true;
    }
    
    // Check post breakpoints length against expectation based on how many levels are 'Full'/'Unset'
    const postBpLength = originalSettings.postTruncationBreakpoints?.length ?? 0;
    const postLevel0IsFullOrUnset = ['Full', 'Unset'].includes(levels.postLevel0);
    const postLevel1IsFullOrUnset = ['Full', 'Unset'].includes(levels.postLevel1);
    const postLevel2IsFullOrUnset = ['Full', 'Unset'].includes(levels.postLevel2);
    
    // Expected breakpoints length based on how many levels have number values
    const expectedLength = 
      (postLevel0IsFullOrUnset ? 0 : 1) + 
      (postLevel1IsFullOrUnset ? 0 : 1) + 
      (postLevel2IsFullOrUnset ? 0 : 1);
    
    if (postBpLength !== expectedLength) {
      log(`post breakpoint length mismatch: expected ${expectedLength}, stored length ${postBpLength}`);
      return true;
    }

    return false; // No mismatch found
  };

  const showWarning = checkMismatch();

  return (
    <div className={classes.settingGroup}>
      <h3 className={classes.groupTitle}>Content Display Length</h3>
      <p className={classes.groupDescription}>
        Choose how much content to show for posts and comments.
        <ul>
          <li>Deemphasized comments start at Level 0. Comments of primary interest start at Level 1.</li>
          <li>If text remains after final truncation amount, a "continue reading" button will appear.</li>
        </ul>

        See Advanced View for granular control.
        
      </p>
      {showWarning && (
        <p className={classes.customWarningMessage}>
          Note: Some settings were customized in Advanced view. Changing an option below will reset it to the selected preset.
        </p>
      )}
      <div className={classes.truncationGridContainer}>
        {/* Column Headers */}
        <div /> {/* Empty corner */}
        <div className={classes.truncationGridHeader}>Posts</div> {/* Col Header */}
        <div className={classes.truncationGridHeader}>Comments</div> {/* Col Header */}

        {/* Initial Row */}
        <div className={classes.truncationGridRowHeader}>Level 0</div> {/* Row Header */}
        <div className={classes.truncationGridCell}>{renderDropdown('postLevel0')}</div>
        <div className={classes.truncationGridCell}>{renderDropdown('commentLevel0')}</div>

        {/* Expanded Row */}
        <div className={classes.truncationGridRowHeader}>Level 1</div> {/* Row Header */}
        <div className={classes.truncationGridCell}>{renderDropdown('postLevel1')}</div>
        <div className={classes.truncationGridCell}>{renderDropdown('commentLevel1')}</div>
        
        {/* Level 2 Row */}
        <div className={classes.truncationGridRowHeader}>Level 2</div> {/* Row Header */}
        <div className={classes.truncationGridCell}>{renderDropdown('postLevel2')}</div>
        <div className={classes.truncationGridCell}>{renderDropdown('commentLevel2')}</div>
      </div>
    </div>
  );
};

// Breakpoint Input Component
const BreakpointInput = ({
  kind,
  index,
  value,
  hasError,
  onChange,
}: {
  kind: 'post' | 'comment';
  index: number;
  value: number | null | '';
  hasError: boolean;
  onChange: (kind: 'post' | 'comment', index: number, value: string | number | null) => void;
}) => {
  const displayValue = value === null || value === '' ? '' : value;

  const classes = useStyles(styles);
  
  return <div className={classes.truncationGridCell}>
    <input
      type="number"
      className={classNames(classes.sourceWeightInput, { [classes.invalidInput]: hasError })}
      value={displayValue}
      onChange={(e) => onChange(kind, index, e.target.value ?? '')} // Send empty string if cleared
      min={10}
      step={50}
      placeholder={'unset'}
    />
  </div>;
};

interface AdvancedTruncationSettingsProps {
  values: {
    lineClampNumberOfLines: number;
    postBreakpoints: (number | null | '')[];
    commentBreakpoints: (number | null | '')[];
  };
  errors: {
    lineClampNumberOfLines?: boolean;
    postBreakpoints?: boolean;
    commentBreakpoints?: boolean;
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

  const breakpointInputProps = {
    hasError: !!errors.postBreakpoints,
    onChange: onBreakpointChange,
  };


  return (
    <div className={classes.settingGroup}>
      <h3 className={classes.groupTitle}>Advanced Truncation</h3>
      <p className={classes.groupDescription}>
        Fine-tune content truncation with precise word counts. Empty values are treated as "no truncation". 
      </p>
      
      <div className={classes.sourceWeightItem}>
        <div className={classes.sourceWeightContainer}>
          <label className={classes.lineClampLabel}>Line Clamp</label>
          <div style={{flex: 1}}>
            <p className={classes.sourceWeightDescription}>
              Number of lines to show for Level 0 comments (0 disables clamping)
            </p>
          </div>
          <input
            type="number"
            className={classNames(classes.sourceWeightInput, {
              [classes.invalidInput]: errors.lineClampNumberOfLines
            })}
            value={values.lineClampNumberOfLines}
            onChange={(e) => onLineClampChange(e.target.value)}
            min={0}
            max={10}
            step={1}
          />
        </div>
        {errors.lineClampNumberOfLines && (
          <p className={classes.errorMessage}>Value must be between 0 and 10</p>
        )}
      </div>
      
      <div className={classes.truncationGridContainer}>
        {/* Column Headers */}
        <div /> {/* Empty corner */}
        <div className={classes.truncationGridHeader}>Posts (words)</div>
        <div className={classes.truncationGridHeader}>Comments (words)</div>

        <div className={classes.truncationGridRowHeader}>Level 0</div>
        <BreakpointInput index={0} value={values.postBreakpoints[0]} kind="post" {...breakpointInputProps} />
        <BreakpointInput index={0} value={values.commentBreakpoints[0]} kind="comment" {...breakpointInputProps} />

        <div className={classes.truncationGridRowHeader}>Level 1</div>
        <BreakpointInput index={1} value={values.postBreakpoints[1]} kind="post" {...breakpointInputProps} />
        <BreakpointInput index={1} value={values.commentBreakpoints[1]} kind="comment" {...breakpointInputProps} />

        <div className={classes.truncationGridRowHeader}>Level 2</div>
        <BreakpointInput index={2} value={values.postBreakpoints[2]} kind="post" {...breakpointInputProps} />
        <BreakpointInput index={2} value={values.commentBreakpoints[2]} kind="comment" {...breakpointInputProps} />
      </div>

      {/* Validation error messages */}
      {errors.postBreakpoints && (
        <p className={classes.errorMessage}>
          Post breakpoints must be positive numbers in ascending order
        </p>
      )}
      {errors.commentBreakpoints && (
        <p className={classes.errorMessage}>
          Comment breakpoints must be positive numbers in ascending order
        </p>
      )}
    </div>
  );
};

interface MultipliersSettingsProps {
  quickTakeBoost: {
    value: number;
    error: boolean;
    onChange: (value: number | string) => void;
  };
  seenPenalty: {
    value: number | '';
    error: boolean;
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
      <p className={classes.groupDescription}>
        Adjust scoring multipliers for specific content types or states.
      </p>

      {/* Quick Take Boost */}
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
              [classes.invalidInput]: quickTakeBoost.error
            })}
            value={quickTakeBoost.value}
            onChange={(e) => quickTakeBoost.onChange(parseFloat(e.target.value))}
            min={0.5}
            max={3.0}
            step={0.1}
          />
        </div>
        <p className={classes.sourceWeightDescription}>Multiplier applied to Quick Takes comments.</p>
        {quickTakeBoost.error && (
          <p className={classes.errorMessage}>Value must be between 0.5 and 3.0</p>
        )}
      </div>

      {/* Seen Penalty Slider */}
      <div className={classes.sourceWeightItem}>
        <div className={classes.sourceWeightContainer}>
          <label className={classes.sourceWeightLabel}>Seen Penalty</label>
          <Slider
            className={classes.sourceWeightSlider}
            value={typeof seenPenalty.value === 'number' ? seenPenalty.value : 0} // Default slider to 0 if empty
            onChange={(_, val) => seenPenalty.onChange(val as number)}
            min={0}
            max={1}
            step={0.05}
            aria-labelledby="seen-penalty-slider"
          />
          <input
            type="number"
            className={classNames(classes.sourceWeightInput, {
              [classes.invalidInput]: seenPenalty.error
            })}
            value={seenPenalty.value} // Show number or empty string
            onChange={(e) => seenPenalty.onChange(e.target.value)} // Pass string value
            min={0}
            max={1}
            step={0.05}
          />
        </div>
        <p className={classes.sourceWeightDescription}>
          Score multiplier for items already marked as seen (0 to 1). Default: {DEFAULT_SETTINGS.ultraFeedSeenPenalty}
        </p>
        {seenPenalty.error && (
          <p className={classes.errorMessage}>Value must be between 0 and 1</p>
        )}
      </div>
    </div>
  );
};
// --- End Multipliers Settings Component ---

const UltraFeedSettings = ({
  settings,
  updateSettings,
  resetSettingsToDefault,
  onClose,
  initialViewMode = 'simple' // Default to simple view
}: {
  settings: UltraFeedSettingsType,
  updateSettings: (newSettings: Partial<UltraFeedSettingsType>) => void,
  resetSettingsToDefault: () => void,
  onClose?: () => void,
  initialViewMode?: 'simple' | 'advanced'
}) => {
  const { captureEvent } = useTracking();
  const classes = useStyles(styles);
  const { LWTooltip } = Components; // Slider is imported directly now

  const { flash } = useMessages();

  const [viewMode, setViewMode] = useState<'simple' | 'advanced'>(() => {
    // Check localStorage only on the client-side
    if (typeof window !== 'undefined') {
      const storedMode = localStorage.getItem('ultraFeedSettingsViewMode');
      if (storedMode === 'simple' || storedMode === 'advanced') {
        return storedMode;
      }
    }
    // Fallback to prop or default
    return initialViewMode;
  });

  // Save viewMode to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('ultraFeedSettingsViewMode', viewMode);
    }
  }, [viewMode]);

  // Initialize local form state from props
  const [formValues, setFormValues] = useState<SettingsFormState>(() => ({
    sourceWeights: { ...DEFAULT_SOURCE_WEIGHTS, ...(settings.sourceWeights || {}) },
    commentLevel0: getCommentLevelFromLines(settings.lineClampNumberOfLines),
    commentLevel1: getCommentBreakpointLevel(settings.commentTruncationBreakpoints?.[1]),
    commentLevel2: 'Long', // Default to Long for Level2
    postLevel0: getPostBreakpointLevel(settings.postTruncationBreakpoints?.[0]),
    postLevel1: getPostBreakpointLevel(settings.postTruncationBreakpoints?.[1]),
    postLevel2: 'Unset', // Default to Unset for Level2
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

  // Initialize local error state
  const [errors, setErrors] = useState<SettingsFormErrors>(() => ({
      sourceWeights: Object.keys(DEFAULT_SOURCE_WEIGHTS).reduce((acc, key) => {
        acc[key as FeedItemSourceType] = false;
        return acc;
      }, {} as Record<FeedItemSourceType, boolean>),
      // Initialize truncation errors if needed
      postLevel0: false,
      postLevel1: false,
      postLevel2: false,
      commentLevel0: false,
      commentLevel1: false,
      commentLevel2: false,
      quickTakeBoost: false,
      // Advanced
      lineClampNumberOfLines: false,
      postBreakpoints: false,
      commentBreakpoints: false,
      // Misc
      ultraFeedSeenPenalty: false,
  }));

  // Update local state if relevant props change
  useEffect(() => {
    const derivedCommentLevel0 = getCommentLevelFromLines(settings.lineClampNumberOfLines);
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

  // --- Handlers ---
  const handleSourceWeightChange = useCallback((key: FeedItemSourceType, value: string | number) => {
    let numValue: number | '' = '';
    let isValid = true;
    const strValue = String(value).trim();

    if (strValue === '') {
      numValue = ''; // Allow empty input temporarily
      isValid = true; // Empty is valid for input, will default to 0 on save
    } else {
      const parsedValue = parseInt(strValue, 10);
      if (!isNaN(parsedValue) && parsedValue >= 0) {
        numValue = parsedValue;
        isValid = true;
      } else {
        // Keep numValue compatible, signal error via `errors` state.
        // The input field will still show the invalid string via `formValues`.
        numValue = ''; 
        isValid = false;
      }
    }

    setFormValues(prev => ({
      ...prev,
      sourceWeights: {
        ...prev.sourceWeights,
        [key]: numValue, 
      },
    }));
    
    setErrors(prev => ({
      ...prev,
      sourceWeights: {
        ...prev.sourceWeights,
        [key]: !isValid,
      },
    }));
  }, []);

  const handleTruncationLevelChange = useCallback((
    field: TruncationGridFields,
    value: TruncationLevel
  ) => {
    setFormValues(prev => ({
      ...prev,
      [field]: value,
    }));
    setErrors(prev => ({
      ...prev,
      [field]: false,
    }));
  }, []);

  const handleBooleanChange = useCallback((
    field: keyof SettingsFormState, // Make it generic for future booleans
    checked: boolean
  ) => {
    setFormValues(prev => ({
      ...prev,
      [field]: checked,
    }));
    // No error state needed typically for checkboxes
  }, []);

  const handleQuickTakeBoostChange = useCallback((value: number | string) => {
    // If string, convert to number (for input field)
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    
    // Only update if it's a valid number
    if (!isNaN(numValue)) {
      setFormValues(prev => ({ ...prev, quickTakeBoost: numValue }));
    }
  }, []);

  const handleSeenPenaltyChange = useCallback((value: number | string) => {
    const strValue = String(value).trim();
    if (strValue === '') {
      setFormValues(prev => ({ ...prev, ultraFeedSeenPenalty: '' }));
    } else if (typeof value === 'number') { 
      // Direct number input from Slider
      setFormValues(prev => ({ ...prev, ultraFeedSeenPenalty: value }));
    } else { // String input from text field
      const numValue = parseFloat(strValue);
      // Update only if it's a valid number parseable from string
      if (!isNaN(numValue)) { 
        setFormValues(prev => ({ ...prev, ultraFeedSeenPenalty: numValue }));
      }
    }
  }, []);

  const handleSave = useCallback(() => {
    // --- Source Weight Validation (existing) ---
    const finalWeights: Record<FeedItemSourceType, number> = { ...DEFAULT_SOURCE_WEIGHTS };
    let hasErrors = false;
    Object.entries(formValues.sourceWeights).forEach(([key, value]) => {
       const sourceKey = key as FeedItemSourceType;
       const numValue = parseInt(String(value), 10);

       if (String(value) === '' || (isNaN(numValue) && String(value) !== '')) {
          // If empty, use 0. If not empty but NaN, it's an error.
          if (String(value) === '') {
             finalWeights[sourceKey] = 0;
        } else {
             hasErrors = true;
             setErrors(prev => ({...prev, sourceWeights: {...prev.sourceWeights, [sourceKey]: true}}));
          }
       } else if (numValue < 0) {
          hasErrors = true;
          setErrors(prev => ({...prev, sourceWeights: {...prev.sourceWeights, [sourceKey]: true}}));
        } else {
          finalWeights[sourceKey] = numValue;
          setErrors(prev => ({...prev, sourceWeights: {...prev.sourceWeights, [sourceKey]: false}}));
       }
    });
    const anySourceWeightErrors = Object.values(errors.sourceWeights).some(hasError => hasError);

    // --- Truncation Level Translation ---
    const lineClamp = levelToCommentLinesMap[formValues.commentLevel0];

    // Comment Breakpoints: Level 0, 1, 2 -> bp0, bp1, bp2
    const rawBp0 = levelToCommentBreakpointMap[formValues.commentLevel0];
    const rawBp1 = levelToCommentBreakpointMap[formValues.commentLevel1];
    const rawBp2 = levelToCommentBreakpointMap[formValues.commentLevel2];

    // Build array preserving positions
    let commentBreakpoints: (number | null)[] = [];
    // Add each value if it's defined
    if (rawBp0 !== undefined) commentBreakpoints.push(rawBp0);
    if (rawBp1 !== undefined) commentBreakpoints.push(rawBp1);
    if (rawBp2 !== undefined) commentBreakpoints.push(rawBp2);
    
    // trim trailing nulls (explicit Full)
    while (commentBreakpoints.length > 0 && commentBreakpoints[commentBreakpoints.length-1] === null) {
      commentBreakpoints.pop();
    }
    
    // Post breakpoints logic - different handling
    const p0 = levelToPostBreakpointMap[formValues.postLevel0];
    const p1 = levelToPostBreakpointMap[formValues.postLevel1];
    const p2 = levelToPostBreakpointMap[formValues.postLevel2];
    
    // For posts, collect numbers only (filter out null and undefined)
    const postBreakpoints: number[] = [];
    if (typeof p0 === 'number') postBreakpoints.push(p0);
    if (typeof p1 === 'number') postBreakpoints.push(p1);
    if (typeof p2 === 'number') postBreakpoints.push(p2);
    
    // Sort post breakpoints by value
    postBreakpoints.sort((a, b) => a - b);
    
    // Remove duplicates
    const uniquePostBreakpoints = [...new Set(postBreakpoints)];

    // --- Check Global Errors ---
    if (hasErrors || anySourceWeightErrors /* || other errors */) {
      console.log("Validation errors prevent saving", errors);
          return;
    }

    // --- Validate quickTakeBoost (between 0.5 and 3.0)
    const qtb = formValues.quickTakeBoost;
    if (qtb < 0.5 || qtb > 3.0) {
      hasErrors = true;
      setErrors(prev => ({ ...prev, quickTakeBoost: true }));
    } else {
      setErrors(prev => ({ ...prev, quickTakeBoost: false }));
    }

    // --- Validate Advanced Truncation Settings ---
    // Line clamp: integer 0-10 or empty string (which maps to 0)
    const lcnl = formValues.lineClampNumberOfLines;
    let lineClampValid = false;
    let finalLineClampValue = 0; // Default to 0 if empty or invalid

    if (lcnl === '') {
      lineClampValid = true;
      finalLineClampValue = 0;
    } else if (typeof lcnl === 'number') {
      if (Number.isInteger(lcnl) && lcnl >= 0 && lcnl <= 10) {
        lineClampValid = true;
        finalLineClampValue = lcnl;
      } else {
        lineClampValid = false;
      }
    } else {
       lineClampValid = false; // Should not happen if handleLineClampChange is correct
    }

    if (!lineClampValid) {
      hasErrors = true;
      setErrors(prev => ({ ...prev, lineClampNumberOfLines: true }));
    } else {
      setErrors(prev => ({ ...prev, lineClampNumberOfLines: false }));
    }

    // Post breakpoints: must be positive numbers in ascending order
    const validPostBps = formValues.postBreakpoints
      .filter((bp): bp is number => typeof bp === 'number')
      .sort((a, b) => a - b);
    
    // Check if properly ascending (each next value > previous)
    let postBpsValid = true;
    for (let i = 1; i < validPostBps.length; i++) {
      if (validPostBps[i] <= validPostBps[i-1]) {
        postBpsValid = false;
        break;
      }
    }
    
    if (!postBpsValid) {
      hasErrors = true;
      setErrors(prev => ({ ...prev, postBreakpoints: true }));
    } else {
      setErrors(prev => ({ ...prev, postBreakpoints: false }));
    }
    
    // Comment breakpoints: similar validation
    const validCommentBps = formValues.commentBreakpoints
      .filter((bp): bp is number => typeof bp === 'number')
      .sort((a, b) => a - b);
    
    let commentBpsValid = true;
    for (let i = 1; i < validCommentBps.length; i++) {
      if (validCommentBps[i] <= validCommentBps[i-1]) {
        commentBpsValid = false;
        break;
      }
    }
    
    if (!commentBpsValid) {
      hasErrors = true;
      setErrors(prev => ({ ...prev, commentBreakpoints: true }));
    } else {
      setErrors(prev => ({ ...prev, commentBreakpoints: false }));
    }

    // --- Validate Misc Settings ---
    // Seen Penalty: number 0-10 or empty string (maps to default)
    const usp = formValues.ultraFeedSeenPenalty;
    let seenPenaltyValid = false;
    let finalSeenPenaltyValue = DEFAULT_SETTINGS.ultraFeedSeenPenalty; // Default if empty/invalid
    if (usp === '') {
      seenPenaltyValid = true;
      finalSeenPenaltyValue = DEFAULT_SETTINGS.ultraFeedSeenPenalty; // Explicitly use default
    } else if (typeof usp === 'number') {
      if (usp >= 0 && usp <= 10) { // Allow float between 0 and 10
        seenPenaltyValid = true;
        finalSeenPenaltyValue = usp;
      } else {
        seenPenaltyValid = false;
      }
    } else {
      seenPenaltyValid = false;
    }

    if (!seenPenaltyValid) {
      hasErrors = true;
      setErrors(prev => ({ ...prev, ultraFeedSeenPenalty: true }));
    } else {
      setErrors(prev => ({ ...prev, ultraFeedSeenPenalty: false }));
    }
    
    // Post Titles are Modals: No validation needed (boolean)
    // Incognito Mode: No validation needed (boolean)

    // --- Prepare Update Object ---
    const settingsToUpdate: Partial<UltraFeedSettingsType> = {
      sourceWeights: finalWeights,
      // Default lineClamp value from simple view calculation (overwritten in advanced mode)
      lineClampNumberOfLines: viewMode === 'simple' ? levelToCommentLinesMap[formValues.commentLevel0] : finalLineClampValue,
      commentTruncationBreakpoints: commentBreakpoints, // Default from simple view (overwritten below)
      postTruncationBreakpoints: uniquePostBreakpoints, // Default from simple view (overwritten below)
      incognitoMode: formValues.incognitoMode,
      quickTakeBoost: formValues.quickTakeBoost,
      // Misc Settings (always save these regardless of view mode)
      ultraFeedSeenPenalty: finalSeenPenaltyValue, 
      postTitlesAreModals: formValues.postTitlesAreModals,
    };

    // If in advanced view, use the direct values instead of the calculated ones from simple view
    if (viewMode === 'advanced') {
      settingsToUpdate.lineClampNumberOfLines = finalLineClampValue; // Use validated/parsed value
      
      // Filter empty strings and undefined, keep nulls (explicit Full)
      const advancedPostBps = formValues.postBreakpoints
        .filter(bp => bp !== '' && bp !== undefined);
      
      const advancedCommentBps = formValues.commentBreakpoints
        .filter(bp => bp !== '' && bp !== undefined);
      
      settingsToUpdate.postTruncationBreakpoints = advancedPostBps;
      settingsToUpdate.commentTruncationBreakpoints = advancedCommentBps;
    }

    // --- Call Prop ---
    console.log("Saving settings:", settingsToUpdate);
    updateSettings(settingsToUpdate);

    flash("Settings saved");

    captureEvent("ultraFeedSettingsUpdated", {
      oldSettings: settings,
      newSettings: settingsToUpdate
    });
    // Optionally call onClose()
  }, [formValues, updateSettings, captureEvent, settings, errors, viewMode, flash]);
  
  const handleReset = useCallback(() => {
    resetSettingsToDefault();
    setErrors(() => ({
      sourceWeights: Object.keys(DEFAULT_SOURCE_WEIGHTS).reduce((acc, key) => {
          acc[key as FeedItemSourceType] = false;
          return acc;
      }, {} as Record<FeedItemSourceType, boolean>),
      // Reset truncation errors
      postLevel0: false,
      postLevel1: false,
      postLevel2: false,
      commentLevel0: false,
      commentLevel1: false,
      commentLevel2: false,
      quickTakeBoost: false,
      // Advanced
      lineClampNumberOfLines: false,
      postBreakpoints: false,
      commentBreakpoints: false,
      // Misc
      ultraFeedSeenPenalty: false,
    }));
  }, [resetSettingsToDefault]);
  
  const renderSimpleView = () => (
    <>
      <SourceWeightsSettings
        weights={formValues.sourceWeights}
        errors={errors.sourceWeights}
        onChange={handleSourceWeightChange}
      />
      <TruncationGridSettings
        levels={formValues}
        onChange={handleTruncationLevelChange}
        originalSettings={settings} // Pass original settings down
      />
    </>
  );

  // Advanced truncation handlers
  const handleLineClampChange = useCallback((value: number | string) => {
    const strValue = String(value).trim();
    if (strValue === '') {
      setFormValues(prev => ({ ...prev, lineClampNumberOfLines: '' }));
    } else {
      const numValue = parseInt(strValue, 10);
      // Only update if it's a valid integer
      if (!isNaN(numValue) && Number.isInteger(Number(strValue))) { 
        setFormValues(prev => ({ ...prev, lineClampNumberOfLines: numValue }));
      }
    }
  }, []);

  const handleBreakpointChange = useCallback((
    kind: 'post' | 'comment',
    index: number,
    value: string | number | null
  ) => {
    setFormValues(prev => {
      const field = kind === 'post' ? 'postBreakpoints' : 'commentBreakpoints';
      const currentArray = [...prev[field]];
      
      // Allow empty string while typing
      if (value === '') {
        currentArray[index] = '';
      } 
      // Allow explicit null (Full)
      else if (value === null) {
        currentArray[index] = null;
      }
      // For numeric input, parse to number
      else if (typeof value === 'string') {
        const parsed = parseInt(value, 10);
        currentArray[index] = isNaN(parsed) ? '' : parsed;
      } 
      // Already a number
      else {
        currentArray[index] = value;
      }
      
      return { ...prev, [field]: currentArray };
    });
  }, []);


  const renderAdvancedView = () => (
    <>
      <SourceWeightsSettings
        weights={formValues.sourceWeights}
        errors={errors.sourceWeights}
        onChange={handleSourceWeightChange}
      />
      <MultipliersSettings
        quickTakeBoost={{
          value: formValues.quickTakeBoost,
          error: errors.quickTakeBoost ?? false,
          onChange: handleQuickTakeBoostChange,
        }}
        seenPenalty={{
          value: formValues.ultraFeedSeenPenalty,
          error: errors.ultraFeedSeenPenalty ?? false,
          onChange: handleSeenPenaltyChange,
        }}
      />
      
      {/* Add the Advanced Truncation Settings component */}
      <AdvancedTruncationSettings
        onLineClampChange={handleLineClampChange}
        onBreakpointChange={handleBreakpointChange}
        values={{
          lineClampNumberOfLines: formValues.lineClampNumberOfLines === '' ? 0 : formValues.lineClampNumberOfLines,
          postBreakpoints: formValues.postBreakpoints,
          commentBreakpoints: formValues.commentBreakpoints,
        }}
        errors={{
          lineClampNumberOfLines: errors.lineClampNumberOfLines,
          postBreakpoints: errors.postBreakpoints,
          commentBreakpoints: errors.commentBreakpoints,
        }}
      />
      
      {/* --- Misc Section --- */}
      <div className={classes.settingGroup}>
        <h3 className={classes.groupTitle}>Misc</h3>
        
        {/* Post Titles are Modals */}
        <div className={classes.checkboxContainer}>
          <Checkbox
            id="postTitlesAreModalsCheckbox"
            className={classes.checkboxInput}
            checked={formValues.postTitlesAreModals}
            onChange={(e) => handleBooleanChange('postTitlesAreModals', e.target.checked)}
            color="primary"
          />
          <label htmlFor="postTitlesAreModalsCheckbox" className={classes.checkboxLabel}>
            Open Post Titles in Modals
          </label>
        </div>
        <p className={classes.groupDescription} style={{marginTop: 0, marginBottom: 16}}>
          When disabled, clicking a post title navigates directly to the post page.
        </p>

        {/* Incognito Mode */}
        <div className={classes.checkboxContainer}>
          <Checkbox
            id="incognitoModeCheckbox"
            className={classes.checkboxInput}
            checked={formValues.incognitoMode}
            onChange={(e) => handleBooleanChange('incognitoMode', e.target.checked)}
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
      {/* --- End Misc Section --- */}
    </>
  );

  const hasAnyErrors = useMemo(() => {
     return Object.values(errors.sourceWeights).some(e => e);
     // || Object.values(errors.otherSetting).some(e => e) ...
  }, [errors]);

  return (
    <div className={classes.root}>
      <div className={classes.viewModeToggle}>
        <div
          onClick={() => setViewMode('simple')}
          className={classNames( classes.viewModeButton, viewMode === 'simple' ? classes.viewModeButtonActive : classes.viewModeButtonInactive
          )}
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

      {/* Common Save/Reset Buttons */}
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

// Keep the global declaration
declare global {
  interface ComponentTypes {
    UltraFeedSettings: typeof UltraFeedSettingsComponent
  }
} 
