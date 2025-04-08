import React, { useState, useCallback, useMemo } from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import { useUltraFeedSettings, DEFAULT_SETTINGS } from '../../lib/ultraFeedSettings';
import { defineStyles, useStyles } from '../hooks/useStyles';
import classNames from 'classnames';

const styles = defineStyles('UltraFeedSettings', (theme: ThemeType) => ({
  root: {
    width: '100%',
  },
  settingGroup: {
    marginBottom: 16,
  },
  groupTitle: {
    fontSize: '1.1rem',
    fontWeight: 500,
    marginBottom: 8,
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
    paddingLeft: 180,
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
}));

const UltraFeedSettings = ({ onClose }: { onClose: () => void }) => {
  const classes = useStyles(styles);
  const { settings, updateSetting, resetSettings } = useUltraFeedSettings();
  
  // Local state for form values
  const [formValues, setFormValues] = useState({
    postTruncationBreakpoints: [...settings.postTruncationBreakpoints],
    commentTruncationBreakpoints: [...settings.commentTruncationBreakpoints],
    collapsedCommentTruncation: settings.collapsedCommentTruncation,
    lineClampNumberOfLines: settings.lineClampNumberOfLines,
  });
  
  // Track validation errors
  const [errors, setErrors] = useState({
    postTruncationBreakpoints: [] as number[],
    commentTruncationBreakpoints: [] as number[],
    collapsedCommentTruncation: false,
    lineClampNumberOfLines: false,
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
        // Allow empty string but mark as error
        newArray[index] = '' as any; // Using 'any' to allow empty string temporarily
        
        // Update errors
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
        
        // Clear error if value is valid
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
      // Allow empty input but mark as error
      setFormValues(prev => ({
        ...prev,
        [key]: '' as any // Using 'any' to allow empty string temporarily
      }));
      
      // Set error for this field
      setErrors(prev => ({
        ...prev,
        [key]: true
      }));
    } else {
      const numValue = parseInt(value, 10);
      
      setFormValues(prev => ({
        ...prev,
        [key]: numValue
      }));
      
      // Clear error if value is valid
      if (!isNaN(numValue)) {
        setErrors(prev => ({
          ...prev,
          [key]: false
        }));
      }
    }
  }, []);
  
  // Check if the form has any validation errors
  const hasErrors = useMemo(() => {
    return errors.postTruncationBreakpoints.length > 0 ||
           errors.commentTruncationBreakpoints.length > 0 ||
           errors.collapsedCommentTruncation ||
           errors.lineClampNumberOfLines;
  }, [errors]);

  // Handle form submission
  const handleSave = useCallback(() => {
    // First validate all inputs to make sure there are no empty fields
    let hasEmptyFields = false;
    
    // Check array fields for empty values
    ['postTruncationBreakpoints', 'commentTruncationBreakpoints'].forEach((key) => {
      const arr = formValues[key as keyof typeof formValues] as any[];
      arr.forEach((val, index) => {
        if (val === '' || val === null || val === undefined) {
          hasEmptyFields = true;
          
          // Mark as error
          setErrors(prev => {
            const fieldErrors = [...prev[key as 'postTruncationBreakpoints' | 'commentTruncationBreakpoints']];
            if (!fieldErrors.includes(index)) {
              fieldErrors.push(index);
            }
            return {
              ...prev,
              [key]: fieldErrors
            };
          });
        }
      });
    });
    
    // Check collapsedCommentTruncation
    const collapseValue = formValues.collapsedCommentTruncation;
    if ((typeof collapseValue === 'string' && collapseValue === '') || 
        collapseValue === null || 
        collapseValue === undefined) {
      hasEmptyFields = true;
      setErrors(prev => ({
        ...prev,
        collapsedCommentTruncation: true
      }));
    }
    
    // If there are any errors, don't save
    if (hasEmptyFields) {
      return;
    }
    
    // Update all settings at once
    Object.entries(formValues).forEach(([key, value]) => {
      updateSetting(key as keyof typeof formValues, value);
    });
    // onClose();
  }, [formValues, updateSetting, setErrors]);
  
  // Handle reset button
  const handleReset = useCallback(() => {
    resetSettings();
    onClose();
  }, [resetSettings, onClose]);
  
  return (
    <div className={classes.root}>
      <div className={classes.settingGroup}>
        <h3 className={classes.groupTitle}>Display Options</h3>
        
        <div className={classes.inputContainer}>
          <label className={classes.inputLabel}>Line Clamp Lines:</label>
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
          <p className={classes.inputDescription}>
            Number of lines to show in collapsed comments (0 disables line clamp, 2-10 lines recommended)
          </p>
          {errors.lineClampNumberOfLines && (
            <p className={classes.errorMessage}>Field must contain a valid number between 0 and 10</p>
          )}
        </div>
      </div>
      
      <div className={classes.settingGroup}>
        <h3 className={classes.groupTitle}>Truncation</h3>
        <p className={classes.groupDescription}>
          Word count limits for expanding content. Lower values show less initially.
        </p>
        
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
          <label className={classes.inputLabel}>Collapsed comment:</label>
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
          <p className={classes.inputDescription}>
            Default: {DEFAULT_SETTINGS.collapsedCommentTruncation} words
          </p>
          {errors.collapsedCommentTruncation && (
            <p className={classes.errorMessage}>Field must contain a valid number</p>
          )}
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
