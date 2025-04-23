import React, { useState, useCallback, useEffect } from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import { truncateWithGrace } from '../../lib/editor/ellipsize';
import classNames from 'classnames';
import { postGetPageUrl } from '../../lib/collections/posts/helpers';
import { commentGetPageUrlFromIds } from '../../lib/collections/comments/helpers';
import { Link } from '../../lib/reactRouterWrapper';
import { defineStyles, useStyles } from '../../components/hooks/useStyles';

// Constants for Text Fragment Generation
const FRAGMENT_START_WORDS = 5; // Number of words for the starting phrase
const FRAGMENT_END_WORDS = 3;   // Number of words for the ending phrase
const FRAGMENT_SEPARATION_WORDS = 20; // Minimum words between end of start phrase and start of end phrase
const MIN_WORDS_FOR_FRAGMENT = FRAGMENT_START_WORDS + FRAGMENT_SEPARATION_WORDS + FRAGMENT_END_WORDS; // Min words needed in source text
const MIN_WORDS_FOR_STRADDLE_FRAGMENT = FRAGMENT_START_WORDS + FRAGMENT_END_WORDS + 10; // Need buffer around limit

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
    // Hide first blockquote when line clamping is active
    '& blockquote:first-child': {
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

type PostProps = { post: PostsList|UltraFeedPostFragment; comment?: never; tag?: never };
type CommentProps = { post?: never; comment: CommentsList; tag?: never };
type TagProps = { post?: never; comment?: never; tag: TagBasicInfo };

type DocumentProps = PostProps | CommentProps | TagProps;

export interface BaseFeedContentBodyProps {
  html: string;
  breakpoints?: number[];
  initialExpansionLevel?: number;
  linkToDocumentOnFinalExpand?: boolean;
  onContinueReadingClick?: (params: { textFragment?: string }) => void;
  wordCount: number;
  onExpand?: (level: number, maxLevelReached: boolean, wordCount: number) => void;
  description?: string;
  nofollow?: boolean;
  className?: string;
  /** Override word truncation with line clamping (number of lines) */
  clampOverride?: number;
  /** If true, don't show the inline '(read more)' suffix */
  hideSuffix?: boolean;
  /** when changed, resets expansion level to 0 */
  resetSignal?: number;
}

type FeedContentBodyProps = BaseFeedContentBodyProps & DocumentProps;

interface RenderContinueReadingActionProps {
  showContinueReadingAction: boolean;
  onContinueReadingClick?: (params: { textFragment?: string }) => void;
  fullHtmlForGeneration: string;
  truncatedHtmlWithoutSuffix: string;
  classes: Record<"readMoreButton", string>;
  wordsLeft: number;
}

// Helper function to generate the text fragment hash using truncated end and full start
const generateTextFragment = (truncatedHtml: string, fullHtml: string): string | undefined => {
    if (typeof window === 'undefined') {
        console.warn('[TextFragment] Not in browser environment. Cannot generate fragment.');
        return undefined;
    }

    const parser = new DOMParser();

    // --- Process Truncated HTML --- 
    const truncatedDoc = parser.parseFromString(truncatedHtml, 'text/html');
    // Normalize spaces, keep punctuation
    const truncatedTextContent = (truncatedDoc.body.textContent || '').replace(/\s+/g, ' ').trim(); 
    const truncatedWords = truncatedTextContent.split(' ');
    const truncatedWordCount = truncatedWords.length;

    if (truncatedWordCount < FRAGMENT_START_WORDS) {
        console.log('[TextFragment] Not generated: Truncated text too short for start phrase.');
        return undefined;
    }
    // textStart: Last words of truncated text
    const startStartIndex = Math.max(0, truncatedWordCount - FRAGMENT_START_WORDS);
    const textStart = truncatedWords.slice(startStartIndex).join(' ');

    // --- Process Full HTML --- 
    const fullDoc = parser.parseFromString(fullHtml, 'text/html');
    // Normalize spaces, keep punctuation
    const fullTextContent = (fullDoc.body.textContent || '').replace(/\s+/g, ' ').trim(); 
    const fullWords = fullTextContent.split(' ');
    const fullWordCount = fullWords.length;

    // textEnd: First words of the *continuation* text
    // Start looking for end phrase right after the truncated word count
    const continuationStartIndex = truncatedWordCount; 
    if (continuationStartIndex >= fullWordCount || (continuationStartIndex + FRAGMENT_END_WORDS) > fullWordCount) {
        console.log('[TextFragment] Not generated: Full text not long enough for end phrase after truncation point.');
        return undefined;
    }
    const textEnd = fullWords.slice(continuationStartIndex, continuationStartIndex + FRAGMENT_END_WORDS).join(' ');

    // --- Combine and return --- 
    if (textStart && textEnd) {
        // Note: We are not enforcing separation here, relying on the truncation itself
        const textFragmentHash = `#:~:text=${encodeURIComponent(textStart)},${encodeURIComponent(textEnd)}`;
        console.log('[TextFragment] Generated (TruncatedEnd/FullStart):', 
                    { textStart, textEnd, textFragmentHash, truncatedWordCount, fullWordCount });
        return textFragmentHash;
    } else {
        console.log('[TextFragment] Not generated: Failed to extract textStart or textEnd phrases.');
        return undefined;
    }
};

const renderContinueReadingAction = ({
  showContinueReadingAction,
  onContinueReadingClick,
  fullHtmlForGeneration,
  truncatedHtmlWithoutSuffix,
  classes,
  wordsLeft,
}: RenderContinueReadingActionProps): React.ReactNode => {
  if (!showContinueReadingAction || !onContinueReadingClick) return null;

  return (
    <div
      className={classes.readMoreButton}
      onClick={(e) => {
        e.stopPropagation();
        // Generate fragment using both HTML versions
        const generatedFragment = generateTextFragment(truncatedHtmlWithoutSuffix, fullHtmlForGeneration);
        onContinueReadingClick({ textFragment: generatedFragment });
      }}
    >
      {`(Continue Reading – ${wordsLeft} words more)`}
    </div>
  );
};

const FeedContentBody = ({
  html,
  breakpoints = [],
  initialExpansionLevel = 0,
  linkToDocumentOnFinalExpand = true,
  onContinueReadingClick,
  wordCount,
  post,
  comment,
  tag,
  onExpand,
  description,
  nofollow = false,
  className,
  clampOverride,
  hideSuffix,
  resetSignal,
}: FeedContentBodyProps) => {

  const classes = useStyles(styles);
  const [expansionLevel, setExpansionLevel] = useState(initialExpansionLevel);
  
  useEffect(() => {
    if (resetSignal !== undefined) {
      setExpansionLevel(0);
    }
  }, [resetSignal]);

  const isMaxLevel = expansionLevel >= breakpoints.length - 1;
  const currentWordLimit = breakpoints[expansionLevel];

  const documentId = post?._id ?? comment?._id ?? tag?._id;

  const applyLineClamp = clampOverride && clampOverride > 0 && expansionLevel === 0;

  let documentType: 'post' | 'comment' | 'tag';
  if (post) {
    documentType = 'post';
  } else if (comment) {
    documentType = 'comment';
  } else {
    documentType = 'tag';
  }

  const getDocumentUrl = () => {
    if (post) {
      return postGetPageUrl(post);
    } else if (comment) {
      return commentGetPageUrlFromIds({ postId: comment.postId, commentId: comment._id });
    } else if (tag) {
      return `/tag/${tag._id}`;
    }
    return '/';
  };

  const handleExpand = useCallback(() => {
    if (isMaxLevel || !breakpoints.length) {
        return; 
    }

    const newLevel = Math.min(expansionLevel + 1, breakpoints.length - 1);
    const newMaxReached = newLevel >= breakpoints.length - 1;
    setExpansionLevel(newLevel);
    onExpand?.(newLevel, newMaxReached, wordCount);
  }, [ expansionLevel, breakpoints.length, onExpand, isMaxLevel, wordCount ]);

  const handleContentClick = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement;

    // if clicking on a link, don't expand, just allow default navigation
    if (target.closest('a')) {
      return;
    }
    handleExpand();
  }, [handleExpand]);

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

    if (!breakpoints.length) {
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

  const showContinueReadingAction = !applyLineClamp && isMaxLevel && wasTruncated;
  const isClickableForExpansion = !isMaxLevel;

  const continueReadingAction = showContinueReadingAction ? renderContinueReadingAction({
    showContinueReadingAction: true,
    onContinueReadingClick,
    fullHtmlForGeneration: html,
    truncatedHtmlWithoutSuffix: truncatedHtmlWithoutSuffix,
    classes,
    wordsLeft,
  }) : null;

  return (
    <div
      className={classNames(
        classes.root,
        className,
        isClickableForExpansion && classes.clickableContent 
      )}
      onClick={isClickableForExpansion ? handleContentClick : undefined}
    >
      <Components.ContentStyles contentType="ultraFeed">
        <div>
            <Components.ContentItemBody
              dangerouslySetInnerHTML={{ __html: truncatedHtml }}
              description={description || `${documentType} ${documentId}`}
              nofollow={nofollow}
              className={classNames({
                [classes.maxHeight]: !applyLineClamp && !isMaxLevel && wasTruncated,
                [classes.lineClamp]: applyLineClamp && wasTruncated,
                [getLineClampClass()]: applyLineClamp && wasTruncated,
                [classes.levelZero]: expansionLevel === 0,
              })}
            />
        </div>
        {continueReadingAction}
      </Components.ContentStyles>
    </div>
  );
};

const FeedContentBodyComponent = registerComponent('FeedContentBody', FeedContentBody);

export default FeedContentBodyComponent;

declare global {
  interface ComponentTypes {
    FeedContentBody: typeof FeedContentBodyComponent
  }
}
