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
    '& p:last-child br:last-child': {
      display: 'none !important',
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
  onContinueReadingClick?: (params: { textFragment?: string }) => void;
  wordCount: number;
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
  const applyLineClamp = clampOverride && clampOverride > 0 && !isExpanded;

  const handleExpand = useCallback(() => {
    if (isExpanded) return;
    
    setIsExpanded(true);
    onExpand?.(true, wordCount);
  }, [isExpanded, onExpand, wordCount]);

  const calculateTruncationState = (): {
    truncatedHtml: string;
    wasTruncated: boolean;
    wordsLeft: number;
    suffix: string;
  } => {
    let truncatedHtml = html;
    let wasTruncated = false;
    let wordsLeft = 0;
    let suffix = '';

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
        // 1. If total content exceeds maxWordCount → open modal (with word count)
        // 2. If total content fits within maxWordCount → expand inline (no word count)
        if (wordCount > maxWordCount) {
          suffix = `...<span class="read-more-suffix" data-action="modal">read ${wordsRemaining} more ${wordsRemaining === 1 ? 'word' : 'words'} →</span>`;
        } else {
          suffix = '...<span class="read-more-suffix" data-action="expand">(read more)</span>';
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

    return { truncatedHtml, wasTruncated, wordsLeft, suffix };
  };

  const { truncatedHtml, wasTruncated, suffix } = calculateTruncationState();

  // Handle clicks on inline read-more suffix and footnote links
  const handleContentClick = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    
    // Check if clicking on the read-more suffix
    if (target.classList.contains('read-more-suffix')) {
      e.preventDefault();
      e.stopPropagation();
      
      const action = target.getAttribute('data-action');
      if (action === 'modal' && onContinueReadingClick) {
        onContinueReadingClick({});
      } else if (action === 'expand') {
        handleExpand();
      }
    }
    
    // Expand to show footnotes
    const anchorElement = target.closest('a');
    if (anchorElement) {
      const href = anchorElement.getAttribute('href');
      if (href && href.startsWith('#fn')) {
        e.preventDefault();
        handleExpand();
      }
    }
  }, [onContinueReadingClick, handleExpand]);

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

  return (
    <div
      className={classNames(
        classes.root,
        className
      )}
    >
      <ContentStyles contentType={styleType}>
        <div onClick={handleContentClick}>
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
      </ContentStyles>
    </div>
  );
};

export default registerComponent('FeedContentBody', FeedContentBody);




