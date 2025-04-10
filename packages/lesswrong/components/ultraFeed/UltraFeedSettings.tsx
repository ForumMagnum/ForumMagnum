import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { UltraFeedSettingsType, DEFAULT_SETTINGS, DEFAULT_SOURCE_WEIGHTS } from './ultraFeedSettingsTypes';
import { defineStyles, useStyles } from '../hooks/useStyles';
import classNames from 'classnames';
import { FeedItemSourceType } from './ultraFeedTypes';

const styles = defineStyles('UltraFeedSettings', (theme: ThemeType) => ({
  root: {
    width: '100%',
  },
  settingGroup: {
    marginBottom: 16,
  },
  groupTitle: {
    fontSize: '1.1rem',
    fontWeight: 600,
    marginBottom: 4,
    fontFamily: theme.palette.fonts.sansSerifStack,
  },
  groupDescription: {
    marginBottom: 12,
    color: theme.palette.text.dim,
    fontSize: '0.9rem',
    fontFamily: theme.palette.fonts.sansSerifStack,
  },
  inputContainer: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: 10,
    flexWrap: 'wrap',
  },
  inputLabel: {
    marginRight: 12,
    fontFamily: theme.palette.fonts.sansSerifStack,
    flex: '0 0 180px',
    fontSize: '0.95rem',
  },
  inputDescription: {
    flex: '1 0 100%',
    marginTop: 4,
    marginBottom: 8,
    color: theme.palette.text.dim,
    fontSize: '0.85rem',
    fontFamily: theme.palette.fonts.sansSerifStack,
  },
  arrayInput: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  numberInput: {
    width: 70,
    padding: 6,
    border: '1px solid ' + theme.palette.grey[400],
    borderRadius: 4,
  },
  selectInput: {
    minWidth: 250,
    padding: 6,
    border: '1px solid ' + theme.palette.grey[400],
    borderRadius: 4,
    fontFamily: theme.palette.fonts.sansSerifStack,
  },
  buttonRow: {
    display: 'flex',
    justifyContent: 'flex-end',
    marginTop: 16,
  },
  button: {
    padding: '6px 12px',
    border: 'none',
    borderRadius: 4,
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.primary.contrastText,
    cursor: 'pointer',
    fontFamily: theme.palette.fonts.sansSerifStack,
    fontSize: '0.9rem',
    '&:hover': {
      backgroundColor: theme.palette.primary.dark,
    },
    '&:not(:last-child)': {
      marginRight: 12,
    },
  },
  resetButton: {
    backgroundColor: theme.palette.grey[400],
    color: theme.palette.grey[900],
    '&:hover': {
      backgroundColor: theme.palette.grey[500],
    },
  },
  invalidInput: {
    borderColor: theme.palette.error.main,
  },
  errorMessage: {
    color: theme.palette.error.main,
    fontSize: '0.8rem',
    marginTop: 4,
  },
  buttonDisabled: {
    backgroundColor: theme.palette.grey[400],
    color: theme.palette.grey[800],
    cursor: 'not-allowed',
    '&:hover': {
      backgroundColor: theme.palette.grey[400],
    },
  },
  disabled: {
    opacity: 0.5,
    pointerEvents: 'none',
  },
  sourceWeightInputContainer: {
    display: 'grid',
    gridTemplateColumns: '180px auto',
    gap: '8px 12px',
    alignItems: 'center',
    marginBottom: 12,
  },
  sourceWeightLabel: {
    fontFamily: theme.palette.fonts.sansSerifStack,
    fontSize: '0.95rem',
    textAlign: 'right',
  },
  sourceWeightInput: {
    width: 70,
    padding: 6,
    border: '1px solid ' + theme.palette.grey[400],
    borderRadius: 4,
    justifySelf: 'start',
  },
  sourceWeightDescription: {
    gridColumn: '2 / 3',
    color: theme.palette.text.dim,
    fontSize: '0.85rem',
    fontFamily: theme.palette.fonts.sansSerifStack,
  },
}));

// --- Component Props ---
interface UltraFeedSettingsComponentProps {
  settings: UltraFeedSettingsType;
  updateSettings: (newSettings: Partial<UltraFeedSettingsType>) => void;
  resetSettingsToDefault: () => void;
  classes: Record<string, string>;
  onClose?: () => void;
}

const UltraFeedSettings = ({ settings, updateSettings, resetSettingsToDefault, onClose }: UltraFeedSettingsComponentProps) => {
  const classes = useStyles(styles);
  
  // Initialize formValues state to include sourceWeights
  const [formValues, setFormValues] = useState<UltraFeedSettingsType>(() => ({ 
    ...settings, 
    sourceWeights: { ...DEFAULT_SOURCE_WEIGHTS, ...(settings.sourceWeights || {}) }
  }));

  useEffect(() => {
    // Ensure sourceWeights is always fully populated when settings prop changes
    setFormValues({
      ...settings,
      sourceWeights: { ...DEFAULT_SOURCE_WEIGHTS, ...(settings.sourceWeights || {}) }
    });
  }, [settings]);

  // Initialize errors state to include sourceWeights
  const [errors, setErrors] = useState(() => {
    const initialErrors: Record<string, boolean> = {};
    Object.keys(DEFAULT_SOURCE_WEIGHTS).forEach(key => {
      initialErrors[key] = false;
    });
    return {
      postTruncationBreakpoints: [] as number[],
      commentTruncationBreakpoints: [] as number[],
      collapsedCommentTruncation: false,
      lineClampNumberOfLines: false,
      sourceWeights: initialErrors,
    }
  });

  // Update array of numbers at specific index
  const handleArrayChange = useCallback((
    key: 'postTruncationBreakpoints' | 'commentTruncationBreakpoints',
    index: number,
    value: string
  ) => {
    setFormValues(prev => {
      const newArray = [...prev[key]];
      
      if (value === '') {
        newArray[index] = '' as any; // Allow empty string temporarily
        setErrors(prevErrors => {
          const newErrors = [...prevErrors[key]];
          if (!newErrors.includes(index)) {
            newErrors.push(index);
          }
          return {
            ...prevErrors,
            [key]: newErrors
          };
        });
      } else {
        const numValue = parseInt(value, 10);
        newArray[index] = numValue;
        if (!isNaN(numValue)) {
          setErrors(prevErrors => {
            const newErrors = [...prevErrors[key]].filter(i => i !== index);
            return {
              ...prevErrors,
              [key]: newErrors
            };
          });
        }
      }
      return {
        ...prev,
        [key]: newArray
      };
    });
  }, []);

  // Handle number input change
  const handleNumberChange = useCallback((
    key: 'collapsedCommentTruncation' | 'lineClampNumberOfLines',
    value: string
  ) => {
    if (value === '') {
      setFormValues(prev => ({ ...prev, [key]: '' as any }));
      setErrors(prev => ({ ...prev, [key]: true }));
    } else {
      const numValue = parseInt(value, 10);
      setFormValues(prev => ({ ...prev, [key]: numValue }));
      if (!isNaN(numValue)) {
        setErrors(prev => ({ ...prev, [key]: false }));
      }
    }
  }, []);
  
  // Callback for source weight input changes
  const handleSourceWeightChange = useCallback((key: FeedItemSourceType, value: string) => {
    const numValue = parseInt(value, 10);
    const isValid = !isNaN(numValue) && numValue >= 0;

    setFormValues(prev => ({
      ...prev,
      sourceWeights: {
        ...prev.sourceWeights,
        [key]: value === '' ? '' : numValue, // Store empty string or number
      },
    }));

    setErrors(prev => ({
      ...prev,
      sourceWeights: {
        ...prev.sourceWeights,
        [key]: !isValid || value === '', // Error if not valid OR empty
      },
    }));
  }, []);

  const hasErrors = useMemo(() => {
    const sourceWeightErrors = Object.values(errors.sourceWeights).some(Boolean);
    return errors.postTruncationBreakpoints.length > 0 ||
           errors.commentTruncationBreakpoints.length > 0 ||
           errors.collapsedCommentTruncation ||
           errors.lineClampNumberOfLines ||
           sourceWeightErrors;
  }, [errors]);

  // Handle form submission
  const handleSave = useCallback(() => {
    let hasEmptyFields = false;
    const validatedValues: Partial<UltraFeedSettingsType> = {};
    const validatedWeights: Record<FeedItemSourceType, number> = {} as any;

    // Validate arrays
    ['postTruncationBreakpoints', 'commentTruncationBreakpoints'].forEach(key => {
      const arrKey = key as 'postTruncationBreakpoints' | 'commentTruncationBreakpoints';
      const arr: number[] = formValues[arrKey];
      const validArr: number[] = [];
      arr.forEach((val, index) => {
        // Attempt to parse, even if it's already a number (parseInt handles numbers)
        const numVal = parseInt(String(val), 10);
        if (isNaN(numVal)) { // Check if the result is NaN (covers empty string, non-numeric strings)
          hasEmptyFields = true;
          setErrors(prev => {
            const fieldErrors = [...prev[arrKey]];
            if (!fieldErrors.includes(index)) fieldErrors.push(index);
            return { ...prev, [arrKey]: fieldErrors };
          });
        } else {
          validArr.push(numVal);
        }
      });
      if (!hasEmptyFields) {
        validatedValues[arrKey] = validArr;
      }
    });

    // Validate single number fields
    ['collapsedCommentTruncation', 'lineClampNumberOfLines'].forEach(key => {
      const numKey = key as 'collapsedCommentTruncation' | 'lineClampNumberOfLines';
      const val: number | string = formValues[numKey];
      // Attempt to parse, even if it's already a number
      const numVal = parseInt(String(val), 10);
      if (isNaN(numVal)) { // Check if the result is NaN
        hasEmptyFields = true;
        setErrors(prev => ({ ...prev, [numKey]: true }));
      } else {
        validatedValues[numKey] = numVal;
      }
    });

    // Validate source weights
    Object.entries(formValues.sourceWeights).forEach(([key, val]) => {
      const sourceKey = key as FeedItemSourceType;
      // Attempt to parse, even if it's already a number or empty string
      const numVal = parseInt(String(val), 10);
      if (isNaN(numVal) || numVal < 0) { // Check if NaN or negative
        hasEmptyFields = true;
        setErrors(prev => ({
          ...prev,
          sourceWeights: { ...prev.sourceWeights, [sourceKey]: true }
        }));
      } else {
        validatedWeights[sourceKey] = numVal;
      }
    });

    if (!hasEmptyFields) {
       validatedValues.sourceWeights = validatedWeights;
    }

    if (hasEmptyFields) {
      return;
    }

    // Pass validated values including sourceWeights
    updateSettings({
       ...(validatedValues as Omit<Partial<UltraFeedSettingsType>, 'sourceWeights'>), // Cast existing validated values
       sourceWeights: validatedValues.sourceWeights // Add validated weights
    });
    // if (onClose) onClose();
  }, [formValues, updateSettings, setErrors]);
  
  // Handle reset button
  const handleReset = useCallback(() => {
    resetSettingsToDefault();
  }, [resetSettingsToDefault]);
  
  return (
    <div className={classes.root}>
      <div className={classes.settingGroup}>
        <h3 className={classes.groupTitle}>Source Weights</h3>
        <div className={classes.groupDescription}>
          Relative weights (not %) determining how frequently items from different sources appear in the feed.
        </div>
        <div className={classes.sourceWeightInputContainer}>
          {Object.keys(DEFAULT_SOURCE_WEIGHTS).map((key) => {
            const sourceKey = key as FeedItemSourceType;
            return (
              <React.Fragment key={sourceKey}>
                <label className={classes.sourceWeightLabel}>{sourceKey}:</label>
                <input
                  type="number"
                  className={classNames(classes.sourceWeightInput, {
                    [classes.invalidInput]: errors.sourceWeights[sourceKey]
                  })}
                  value={formValues.sourceWeights[sourceKey] ?? ''} // Handle potential undefined
                  onChange={(e) => handleSourceWeightChange(sourceKey, e.target.value)}
                  min={0}
                />
                {errors.sourceWeights[sourceKey] && (
                   <p className={classNames(classes.errorMessage, classes.sourceWeightDescription)}>Weight must be a non-negative number.</p>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
      
      <div className={classes.settingGroup}>
        <h3 className={classes.groupTitle}>Truncation / Expansion</h3>
        <div className={classes.groupDescription}>
          Word count limits for expanding content. Lower values show less initially.
        </div>
        
        <div className={classes.inputContainer}>
          <div>
            <label className={classes.inputLabel} style={{ display: 'block', marginBottom: '4px' }}>Line Clamp Lines:</label>
            <input
              type="number"
              className={classNames(classes.numberInput, {
                [classes.invalidInput]: errors.lineClampNumberOfLines
              })}
              value={formValues.lineClampNumberOfLines}
              onChange={(e) => handleNumberChange('lineClampNumberOfLines', e.target.value)}
              min={0}
              max={10}
            />
            <p className={classes.inputDescription} style={{ paddingLeft: 0, marginTop: '4px' }}>
              Number of lines to show in collapsed comments (0 disables line clamp, 2-10 lines recommended)
            </p>
            {errors.lineClampNumberOfLines && (
              <p className={classes.errorMessage}>Field must contain a valid number between 0 and 10</p>
            )}
          </div>
        </div>
        <div className={classes.inputContainer}>
          <label className={classes.inputLabel}>Post truncation levels:</label>
          <div className={classes.arrayInput}>
            {formValues.postTruncationBreakpoints.map((value, index) => (
              <input
                key={index}
                type="number"
                className={classNames(classes.numberInput, {
                  [classes.invalidInput]: errors.postTruncationBreakpoints.includes(index)
                })}
                value={value}
                onChange={(e) => handleArrayChange('postTruncationBreakpoints', index, e.target.value)}
                min={1}
              />
            ))}
          </div>
          <p className={classes.inputDescription}>
            Default: {DEFAULT_SETTINGS.postTruncationBreakpoints.join(', ')} words
          </p>
          {errors.postTruncationBreakpoints.length > 0 && (
            <p className={classes.errorMessage}>All fields must contain a valid number</p>
          )}
        </div>
        <div className={classes.inputContainer}>
          <div>
            <label className={classes.inputLabel} style={{ display: 'block', marginBottom: '4px' }}>Collapsed comment:</label>
            <div className={classes.arrayInput}>
              <input
                type="number"
                className={classNames(classes.numberInput, {
                  [classes.invalidInput]: errors.collapsedCommentTruncation
                })}
                value={formValues.collapsedCommentTruncation}
                onChange={(e) => handleNumberChange('collapsedCommentTruncation', e.target.value)}
                min={1}
              />
            </div>
            <p className={classes.inputDescription} style={{ paddingLeft: 0, marginTop: '4px' }}>
              Default: {DEFAULT_SETTINGS.collapsedCommentTruncation} words
            </p>
            {errors.collapsedCommentTruncation && (
              <p className={classes.errorMessage}>Field must contain a valid number</p>
            )}
          </div>
        </div>
        <div className={classes.inputContainer}>
          <label className={classes.inputLabel}>Expanded comments:</label>
          <div className={classes.arrayInput}>
            {formValues.commentTruncationBreakpoints.map((value, index) => (
              <input
                key={index}
                type="number"
                className={classNames(classes.numberInput, {
                  [classes.invalidInput]: errors.commentTruncationBreakpoints.includes(index)
                })}
                value={value}
                onChange={(e) => handleArrayChange('commentTruncationBreakpoints', index, e.target.value)}
                min={1}
              />
            ))}
          </div>
          <p className={classes.inputDescription}>
            Default: {DEFAULT_SETTINGS.commentTruncationBreakpoints.join(', ')} words
          </p>
          {errors.commentTruncationBreakpoints.length > 0 && (
            <p className={classes.errorMessage}>All fields must contain a valid number</p>
          )}
        </div>
      </div>
      
      <div className={classes.buttonRow}>
        <button 
          className={`${classes.button} ${classes.resetButton}`}
          onClick={handleReset}
        >
          Reset to Defaults
        </button>
        <button 
          className={classNames(classes.button, {
            [classes.buttonDisabled]: hasErrors
          })}
          onClick={handleSave}
          disabled={hasErrors}
        >
          Save Changes
        </button>
      </div>
    </div>
  );
};

const UltraFeedSettingsComponent = registerComponent('UltraFeedSettings', UltraFeedSettings);

export default UltraFeedSettingsComponent;

declare global {
  interface ComponentTypes {
    UltraFeedSettings: typeof UltraFeedSettingsComponent
  }
} 
