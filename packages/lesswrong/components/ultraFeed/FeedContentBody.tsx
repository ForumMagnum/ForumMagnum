import React, { useState, useCallback, useEffect } from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { truncateWithGrace } from '../../lib/editor/ellipsize';
import classNames from 'classnames';
import { defineStyles, useStyles } from '../../components/hooks/useStyles';
import { generateTextFragment } from './textFragmentHelpers'
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
  breakpoints?: (number | null)[];
  initialExpansionLevel?: number;
  linkToDocumentOnFinalExpand?: boolean;
  onContinueReadingClick?: (params: { textFragment?: string }) => void;
  wordCount: number;
  onExpand?: (level: number, maxLevelReached: boolean, wordCount: number) => void;
  nofollow?: boolean;
  className?: string;
  /** Override word truncation with line clamping (number of lines) */
  clampOverride?: number;
  /** If true, don't show the inline '(read more)' suffix */
  hideSuffix?: boolean;
  /** when changed, resets expansion level to 0 */
  resetSignal?: number;
}

const FeedContentBody = ({
  html,
  breakpoints = [],
  initialExpansionLevel = 0,
  linkToDocumentOnFinalExpand = true,
  onContinueReadingClick,
  wordCount,
  onExpand,
  nofollow = false,
  className,
  clampOverride,
  hideSuffix,
  resetSignal,
}: FeedContentBodyProps) => {

  const classes = useStyles(styles);
  const [expansionLevel, setExpansionLevel] = useState(initialExpansionLevel);
  const firstRenderRef = React.useRef(true);

  useEffect(() => {
    if (firstRenderRef.current) {
      firstRenderRef.current = false;
      return;
    }
    if (resetSignal !== undefined) {
      setExpansionLevel(0);
    }
  }, [resetSignal]);

  const isMaxLevel = expansionLevel >= breakpoints.length - 1;
  const currentWordLimit = breakpoints[expansionLevel];

  const applyLineClamp = clampOverride && clampOverride > 0 && expansionLevel === 0;

  const handleExpand = useCallback(() => {
    if (isMaxLevel || !breakpoints.length) {
      return;
    }

    const newLevel = Math.min(expansionLevel + 1, breakpoints.length - 1);
    const newMaxReached = newLevel >= breakpoints.length - 1;
    setExpansionLevel(newLevel);
    onExpand?.(newLevel, newMaxReached, wordCount);
  }, [expansionLevel, breakpoints.length, onExpand, isMaxLevel, wordCount]);

  const handleExpandToMax = useCallback(() => {
    const maxLevel = breakpoints.length - 1;
    if (expansionLevel < maxLevel) {
      setExpansionLevel(maxLevel);
      onExpand?.(maxLevel, true, wordCount);
    }
  }, [breakpoints.length, expansionLevel, onExpand, wordCount]);

  // By default links cause expansion to next level (until max), however clicks on links don't expand,
  // just navigate, with the exeption of footnote links, which expand to max (because we need the full footnote for scrolling or modal)
  const handleContentClick = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    const anchorElement = target.closest('a');

    if (anchorElement) {
      const href = anchorElement.getAttribute('href');
      if (href && href.startsWith('#fn')) {
        handleExpandToMax();
      }
      return;
    }

    handleExpand();
  }, [handleExpand, handleExpandToMax]);

  const readMoreSuffixText = '(read more)';

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

    if (!breakpoints.length || currentWordLimit == null) {
      return { truncatedHtml: html, wasTruncated: false, wordsLeft: 0, suffix: '' };
    } else if (applyLineClamp) {
      wasTruncated = true; // assume truncated when line clamp is active, nothing bad happens if it's not
      wordsLeft = 0; // Not used when applyLineClamp is true, set to 0
      truncatedHtml = html; // Render full HTML for CSS clamping
    } else {
      // Word count truncation logic (applies if no clampOverride OR expansionLevel > 0)
      if (hideSuffix || (isMaxLevel && linkToDocumentOnFinalExpand)) {
        suffix = '...';
      } else {
        suffix = `...<span class="read-more-suffix">${readMoreSuffixText}</span>`;
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

      if (wasTruncated) {
        wordsLeft = Math.max(0, wordCount - currentWordLimit);
      } else {
        wordsLeft = 0;
      }
    }

    return { truncatedHtml, wasTruncated, wordsLeft, suffix };
  };

  const { truncatedHtml, wasTruncated, wordsLeft, suffix } = calculateTruncationState();
  // Get truncated HTML *without* the suffix for fragment generation
  const truncatedHtmlWithoutSuffix = truncatedHtml.replace(suffix, '');

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

  const showContinueReadingAction = !applyLineClamp && isMaxLevel && wasTruncated && onContinueReadingClick;
  const isClickableForExpansion = !isMaxLevel;
  const generatedFragment = onContinueReadingClick ? generateTextFragment(truncatedHtmlWithoutSuffix, html) : undefined;

  return (
    <div
      className={classNames(
        classes.root,
        className,
        isClickableForExpansion && classes.clickableContent
      )}
      onClick={isClickableForExpansion ? handleContentClick : undefined}
    >
      <ContentStyles contentType="ultraFeed">
        <div>
          <ContentItemBody
            dangerouslySetInnerHTML={{ __html: truncatedHtml }}
            nofollow={nofollow}
            className={classNames({
              [classes.maxHeight]: !applyLineClamp && !isMaxLevel && wasTruncated,
              [classes.lineClamp]: applyLineClamp && wasTruncated,
              [getLineClampClass()]: applyLineClamp && wasTruncated,
              [classes.levelZero]: expansionLevel === 0,
            })}
          />
        </div>
      </ContentStyles>
      {showContinueReadingAction && <div
        className={classes.readMoreButton}
        onClick={(e) => {
          e.stopPropagation();
          onContinueReadingClick({ textFragment: generatedFragment });
        }}
      >
        {`(Continue Reading - ${wordsLeft} words more)`}
      </div>}
    </div>
  );
};

export default registerComponent('FeedContentBody', FeedContentBody);




