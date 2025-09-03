import React, { useState, useCallback, useEffect } from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { truncateWithGrace, calculateTruncationStatus } from '../../lib/editor/ellipsize';
import classNames from 'classnames';
import { defineStyles, useStyles } from '../../components/hooks/useStyles';
import ContentStyles from "../common/ContentStyles";
import { ContentItemBody } from "../contents/ContentItemBody";

const limitImageHeightClass = (theme: ThemeType) => ({
  maxHeight: 250,
  objectFit: 'contain',
  display: 'block',
  margin: '0 auto',
  [theme.breakpoints.down('sm')]: {
    maxHeight: 'none',
  },
});

const styles = defineStyles('FeedContentBody', (theme: ThemeType) => ({
  root: {
    position: 'relative',
    '& .read-more-suffix': {
      fontFamily: theme.palette.fonts.sansSerifStack,
      color: theme.palette.ultraFeed.dim,
      cursor: 'pointer',
      display: 'inline',
      marginLeft: 0,
    },
    '& .read-suffix-desktop': {
      [theme.breakpoints.down('sm')]: {
        display: 'none',
      },
    },
    '& .read-suffix-mobile': {
      display: 'none',
      [theme.breakpoints.down('sm')]: {
        display: 'inline',
      },
    },
  },
  readActionButton: {
    display: 'none',
    [theme.breakpoints.down('sm')]: {
      display: 'inline-block',
      position: 'absolute',
      right: 8,
      bottom: 0,
      backgroundColor: theme.palette.ultraFeed.readBackgroundMobile,
      paddingLeft: 8,
      paddingRight: 4,
      zIndex: 2,
      fontSize: 'inherit',
      fontFamily: theme.palette.fonts.sansSerifStack,
      color: theme.palette.ultraFeed.dim,
      cursor: 'pointer',
    },
  },
  contentWrapper: {
    position: 'relative',
  },
  fadeOverlay: {
    display: 'none',
    [theme.breakpoints.down('sm')]: {
      display: 'block',
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      // LessWrong body2 lineHeight is 19.8px, so 3 lines = ~60px
      height: 60,
      background: `linear-gradient(to bottom, transparent 0%, ${theme.palette.ultraFeed.readBackgroundMobile} 100%)`,
      pointerEvents: 'none',
      zIndex: 1,
      opacity: 0.8,
    },
  },
  readMoreButton: {
    fontSize: theme.typography.body2.fontSize,
    fontFamily: theme.palette.fonts.sansSerifStack,
    color: theme.palette.link.color,
    cursor: 'pointer',
    marginTop: 12,
    display: 'block',
    opacity: 0.8,
    '&:hover': {
      opacity: 1,
      textDecoration: 'none',
    },
    [theme.breakpoints.down('sm')]: {
      fontSize: 17
    },
  },
  continueReadingLinkContainer: {
    marginTop: 8,
  },
  clickableContent: {
    cursor: 'pointer',
  },
  maxHeight: {
  },
  lineClamp: {
    display: '-webkit-box !important',
    '-webkit-box-orient': 'vertical !important',
    overflow: 'hidden !important',
    // textOverflow: 'ellipsis !important', // might want to reenable
    maxHeight: 'none !important',
    paddingBottom: '0.1em !important',
    '& blockquote:first-child': {
      margin: 0,
      paddingTop: 0,
      paddingBottom: 2,
      marginBottom: '.25em',
      display: '-webkit-box !important',
      '-webkit-box-orient': 'vertical !important',
      WebkitLineClamp: '1 !important',
      overflow: 'hidden !important',
      textOverflow: 'ellipsis',
      '& strong, & b, & em, & i, & h1, & h2, & h3, & h4, & h5, & h6': {
        fontWeight: 'normal !important',
        fontStyle: 'normal !important',
        fontSize: 'inherit !important',
      },
    },
    // Remove whitespace left over after the hidden quote
    '& blockquote + p': {
      // marginTop: '0 !important',
    },
    '& blockquote + p > br:first-child': {
      display: 'none !important',
    },
    '& p:last-child': {
      marginBottom: '0 !important',
    },
    '& img': limitImageHeightClass(theme),
  },
  lineClamp1: {
    WebkitLineClamp: '1 !important',
  },
  lineClamp2: {
    WebkitLineClamp: '2 !important',
  },
  lineClamp3: {
    WebkitLineClamp: '3 !important',
  },
  lineClamp4: {
    WebkitLineClamp: '4 !important',
  },
  lineClamp5: {
    WebkitLineClamp: '5 !important',
  },
  lineClamp6: {
    WebkitLineClamp: '6 !important',
  },
  lineClamp8: {
    WebkitLineClamp: '8 !important',
  },
  lineClamp10: {
    WebkitLineClamp: '10 !important',
  },
  levelZero: {
    '& img': limitImageHeightClass(theme),
  },
}));

export interface FeedContentBodyProps {
  html: string;
  initialWordCount: number;
  maxWordCount: number;
  onContinueReadingClick?: () => void;
  wordCount?: number;
  onExpand?: (expanded: boolean, wordCount: number) => void;
  nofollow?: boolean;
  className?: string;
  /** Override word truncation with line clamping (number of lines) */
  clampOverride?: number;
  /** If true, don't show the inline '(read more)' suffix */
  hideSuffix?: boolean;
  /** When changed, resets to collapsed state */
  resetSignal?: number;
  /** If true, use serif style for the content */
  serifStyle?: boolean;
  /** If true, item has been read - apply style changes and text to "read again" */
  isRead?: boolean;
}

const FeedContentBody = ({
  html,
  initialWordCount,
  maxWordCount,
  onContinueReadingClick,
  wordCount,
  onExpand,
  nofollow = false,
  className,
  clampOverride,
  hideSuffix,
  resetSignal,
  serifStyle = false,
  isRead = false,
}: FeedContentBodyProps) => {

  const classes = useStyles(styles);
  const [isExpanded, setIsExpanded] = useState(false);
  const firstRenderRef = React.useRef(true);

  useEffect(() => {
    if (firstRenderRef.current) {
      firstRenderRef.current = false;
      return;
    }
    if (resetSignal !== undefined) {
      setIsExpanded(false);
    }
  }, [resetSignal]);

  const currentWordLimit = isExpanded ? maxWordCount : initialWordCount;
  const applyLineClamp = false; //to-do fix and reenable

  const handleExpand = useCallback(() => {
    if (isExpanded) return;
    
    setIsExpanded(true);
    onExpand?.(true, wordCount ?? 0);
  }, [isExpanded, onExpand, wordCount]);

  const calculateTruncationState = (): {
    truncatedHtml: string;
    wasTruncated: boolean;
    wordsLeft: number;
    suffix: string;
    actionText: string | null;
  } => {
    let truncatedHtml = html;
    let wasTruncated = false;
    let wordsLeft = 0;
    let suffix = '';
    let actionText: string | null = null;

    // If wordCount is undefined, show all content without truncation
    if (wordCount === undefined) {
      return { truncatedHtml: html, wasTruncated: false, wordsLeft: 0, suffix: '', actionText: null };
    }

    if (applyLineClamp) {
      wasTruncated = true; // assume truncated when line clamp is active, nothing bad happens if it's not
      wordsLeft = 0; // Not used when applyLineClamp is true, set to 0
      truncatedHtml = html; // Render full HTML for CSS clamping
    } else {
      // Word count truncation logic
      const { willTruncate, wordsRemaining } = calculateTruncationStatus(
        wordCount,
        currentWordLimit,
        20 
      );
      
      if (hideSuffix) {
        suffix = '...';
      } else if (willTruncate && !isExpanded) {
        // Determine which action to take when content is truncated:
        // 1. If total content exceeds maxWordCount → show word count
        // 2. If total content fits within maxWordCount → show "(read more)" or "(read again)"
        if (isRead) {
          // The truncated text needs ellipsis, Desktop shows action inline (via suffix), Mobile hides the suffix and shows action as positioned button
          actionText = (wordCount > maxWordCount) ? `(read again, ${wordsRemaining} words →)` : '(read again)';
          // Add both desktop suffix (hidden on mobile) and mobile ellipsis (hidden on desktop)
          suffix = `<span class="read-suffix-mobile">...</span><span class="read-more-suffix read-suffix-desktop">... ${actionText}</span>`;
        } else {
          if (wordCount > maxWordCount) {
            suffix = `<span class="read-more-suffix">... (read ${wordsRemaining} more words →)</span>`;
          } else {
            suffix = `<span class="read-more-suffix">... (read more)</span>`;
          }
        }
      }

      const result = truncateWithGrace(
        html,
        currentWordLimit,
        20,
        wordCount,
        suffix
      );

      truncatedHtml = result.truncatedHtml;
      wasTruncated = result.wasTruncated;
      wordsLeft = result.wordsLeft;
    }

    return { truncatedHtml, wasTruncated, wordsLeft, suffix, actionText };
  };

  const { truncatedHtml, wasTruncated, actionText } = calculateTruncationState();

  const handleContentClick = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    
    // If clicking on a link, let the default behavior happen
    const anchorElement = target.closest('a');
    if (anchorElement) {
      return;
    }
    
    // If wordCount is undefined, don't handle clicks for expansion
    if (wordCount === undefined) {
      return;
    }
    
    // If content is truncated and not expanded, handle click
    if (wasTruncated && !isExpanded) {
      e.preventDefault();
      
      // If total content exceeds maxWordCount → open modal
      // If total content fits within maxWordCount → expand inline
      if (wordCount > maxWordCount && onContinueReadingClick) {
        onContinueReadingClick();
      } else {
        handleExpand();
      }
    }
  }, [onContinueReadingClick, handleExpand, wasTruncated, isExpanded, wordCount, maxWordCount]);

  const getLineClampClass = () => {
    if (!applyLineClamp || !clampOverride) return "";
    switch (clampOverride) {
      case 1: return classes.lineClamp1;
      case 2: return classes.lineClamp2;
      case 3: return classes.lineClamp3;
      case 4: return classes.lineClamp4;
      case 5: return classes.lineClamp5;
      case 6: return classes.lineClamp6;
      case 8: return classes.lineClamp8;
      case 10: return classes.lineClamp10;
      default:
        // eslint-disable-next-line no-console
        console.warn(`No specific class for line clamp value: ${clampOverride}, using default`);
        return classes.lineClamp4;
    }
  };

  const styleType = serifStyle ? 'ultraFeedPost' : 'ultraFeed';

  const handleActionClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // If total content exceeds maxWordCount → open modal
    // If total content fits within maxWordCount → expand inline
    if (wordCount && wordCount > maxWordCount && onContinueReadingClick) {
      onContinueReadingClick();
    } else {
      handleExpand();
    }
  }, [wordCount, maxWordCount, onContinueReadingClick, handleExpand]);

  return (
    <div
      className={classNames(
        classes.root,
        className
      )}
    >
      <ContentStyles contentType={styleType}>
        <div className={classes.contentWrapper}>
          <div 
            onClick={handleContentClick}
            className={classNames({
              [classes.clickableContent]: wasTruncated && !isExpanded,
            })}
          >
            <ContentItemBody
              dangerouslySetInnerHTML={{ __html: truncatedHtml }}
              nofollow={nofollow}
              className={classNames({
                [classes.maxHeight]: !applyLineClamp && !isExpanded && wasTruncated,
                [classes.lineClamp]: applyLineClamp && wasTruncated,
                [getLineClampClass()]: applyLineClamp && wasTruncated,
                [classes.levelZero]: !isExpanded,
              })}
            />
          </div>
          {wasTruncated && !isExpanded && isRead && (
            <div className={classes.fadeOverlay} />
          )}
          {actionText && wasTruncated && !isExpanded && (
            <span 
              className={classes.readActionButton}
              onClick={handleActionClick}
            >
              {actionText}
            </span>
          )}
        </div>
      </ContentStyles>
    </div>
  );
};

export default registerComponent('FeedContentBody', FeedContentBody);




