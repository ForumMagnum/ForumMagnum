import React, { useState, useRef, useEffect } from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { defineStyles, useStyles } from '../hooks/useStyles';
import CheckIcon from '@/lib/vendor/@material-ui/icons/src/Check';
import classNames from 'classnames';

const styles = defineStyles("SeeLessFeedback", (theme: ThemeType) => ({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    borderRadius: 4,
    zIndex: theme.zIndexes.sidebarHoverOver,
    [theme.breakpoints.down('sm')]: {
      padding: 16,
    },
  },
  contentBox: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    backgroundColor: theme.palette.panelBackground.default,
    borderRadius: 8,
    padding: 24,
    border: theme.palette.border.commentBorder,
    boxShadow: theme.palette.boxShadow.default,
    [theme.breakpoints.down('sm')]: {
      padding: 16,
    },
  },
  message: {
    fontFamily: theme.palette.fonts.sansSerifStack,
    fontSize: 16,
    marginBottom: 4,
    textAlign: 'center',
    color: theme.palette.text.normal,
    [theme.breakpoints.down('sm')]: {
      fontSize: 14,
    },
  },
  feedbackOptions: {
    display: 'flex',
    flexDirection: 'column',
    // gap: 2,
    // marginBottom: 12,
    width: '100%',
    maxWidth: 250,
  },
  checkbox: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    cursor: 'pointer',
    padding: '4px 12px',
    transition: 'all 0.2s ease',
    '&:hover': {
      backgroundColor: theme.palette.panelBackground.hoverHighlightGrey,
    },
  },
  checkboxSelected: {
    '&:hover': {
      backgroundColor: theme.palette.panelBackground.hoverHighlightGrey,
    },
  },
  checkIcon: {
    width: 18,
    height: 18,
    borderRadius: 3,
    border: `2px solid ${theme.palette.text.dim}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s ease',
  },
  checkIconSelected: {
    backgroundColor: theme.palette.primary.main,
    borderColor: theme.palette.primary.main,
    color: 'white',
  },
  checkboxLabel: {
    fontFamily: theme.palette.fonts.sansSerifStack,
    fontSize: 14,
    color: theme.palette.text.normal,
  },
  buttonContainer: {
    display: 'flex',
    justifyContent: 'center',
    // marginTop: 8,
    // marginBottom: 12,
  },
  undoButton: {
    padding: '6px 24px',
    backgroundColor: 'transparent',
    cursor: 'pointer',
    fontFamily: theme.palette.fonts.sansSerifStack,
    fontSize: 14,
    color: theme.palette.text.normal,
    opacity: 0.7,
    '&:hover': {
      opacity: 1,
    },
  },
  textAreaContainer: {
    width: '100%',
    marginTop: 8,
    marginBottom: 8,
  },
  textArea: {
    width: '100%',
    minHeight: 50,
    padding: '8px 12px',
    borderRadius: 4,
    border: `1px solid ${theme.palette.text.dim}`,
    backgroundColor: theme.palette.panelBackground.default,
    color: theme.palette.text.normal,
    fontFamily: theme.palette.fonts.sansSerifStack,
    fontSize: 14,
    resize: 'vertical',
    '&:focus': {
      outline: 'none',
      borderColor: theme.palette.primary.main,
    },
    '&::placeholder': {
      color: theme.palette.text.dim3,
    },
  },
  betaDisclaimer: {
    width: 250,
    fontFamily: theme.palette.fonts.sansSerifStack,
    fontSize: 14,
    fontStyle: 'italic',
    color: theme.palette.text.dim,
    textAlign: 'center',
  },
}));

interface SeeLessFeedbackProps {
  onUndo: () => void;
  onFeedbackChange: (feedback: FeedbackOptions) => void;
}

export interface FeedbackOptions {
  author: boolean;
  topic: boolean;
  contentType: boolean;
  other: boolean;
  text?: string;
}

const SeeLessFeedback = ({ onUndo, onFeedbackChange }: SeeLessFeedbackProps) => {
  const classes = useStyles(styles);
  const [feedback, setFeedback] = useState<FeedbackOptions>({
    author: false,
    topic: false,
    contentType: false,
    other: false,
    text: '',
  });
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const debouncedOnChange = (newFeedback: FeedbackOptions) => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    
    debounceTimeoutRef.current = setTimeout(() => {
      onFeedbackChange(newFeedback);
    }, 500); // 500ms debounce for text input
  };

  const handleToggle = (option: keyof Omit<FeedbackOptions, 'text'>) => {
    const newFeedback = {
      ...feedback,
      [option]: !feedback[option],
    };
    setFeedback(newFeedback);
    onFeedbackChange(newFeedback);
  };

  const handleTextChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newFeedback = {
      ...feedback,
      text: event.target.value,
    };
    setFeedback(newFeedback);
    debouncedOnChange(newFeedback); // Debounced for text
  };

  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  const options: Array<{ key: keyof Omit<FeedbackOptions, 'text'>; label: string }> = [
    { key: 'author', label: 'See less from this author' },
    { key: 'topic', label: 'See less of this topic' },
    { key: 'contentType', label: 'See less of this content type' },
    { key: 'other', label: 'Other reason' },
  ];

  return (
    <div className={classes.overlay}>
      <div className={classes.contentBox}>
        <div className={classes.message}>
          You've requested to see less like this
        </div>
        <div className={classes.buttonContainer}>
          <button className={classes.undoButton} onClick={onUndo}>
            Undo
          </button>
        </div>
        
        <div className={classes.feedbackOptions}>
          {options.map(({ key, label }) => (
            <div
              key={key}
              className={classNames(
                classes.checkbox,
                { [classes.checkboxSelected]: feedback[key] }
              )}
              onClick={() => handleToggle(key)}
            >
              <div className={classNames(classes.checkIcon, { [classes.checkIconSelected]: feedback[key] })}>
                {feedback[key] && <CheckIcon style={{ fontSize: 14 }} />}
              </div>
              <span className={classes.checkboxLabel}>{label}</span>
            </div>
          ))}
        </div>

        <div className={classes.textAreaContainer}>
          <textarea
            className={classes.textArea}
            placeholder="Tell us more (autosaved)"
            value={feedback.text || ''}
            onChange={handleTextChange}
            maxLength={500}
          />
        </div>

        <div className={classes.betaDisclaimer}>
          Note: Effects of "see less" might not be immediate as we are still developing the algorithm.
        </div>
      </div>
    </div>
  );
};

export default registerComponent('SeeLessFeedback', SeeLessFeedback); 