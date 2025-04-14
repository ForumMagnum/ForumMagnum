import React, { useState, useCallback } from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import { truncateWithGrace } from '../../lib/editor/ellipsize';
import classNames from 'classnames';
import { postGetPageUrl } from '../../lib/collections/posts/helpers';
import { commentGetPageUrlFromIds } from '../../lib/collections/comments/helpers';
import { Link } from '../../lib/reactRouterWrapper';
import { defineStyles, useStyles } from '../../components/hooks/useStyles';

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
    color: theme.palette.primary.main,
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
    // paddingBottom: '0.25em !important', // might want to reenable

    // Hide first blockquote when line clamping is active
    '& blockquote:first-child': {
      display: 'none !important',
    },
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
}));

type PostProps = { post: PostsList; comment?: never; tag?: never };
type CommentProps = { post?: never; comment: CommentsList; tag?: never };
type TagProps = { post?: never; comment?: never; tag: TagBasicInfo };

type DocumentProps = PostProps | CommentProps | TagProps;

interface BaseFeedContentBodyProps {
  html: string;
  breakpoints: number[];
  initialExpansionLevel?: number;
  linkToDocumentOnFinalExpand?: boolean;
  wordCount: number;
  onExpand?: (level: number, maxLevelReached: boolean, wordCount: number) => void;
  description?: string;
  nofollow?: boolean;
  className?: string;
  /** Override word truncation with line clamping (number of lines) */
  clampOverride?: number;
  /** If true, don't show the inline '(read more)' suffix */
  hideSuffix?: boolean;
}

type FeedContentBodyProps = BaseFeedContentBodyProps & DocumentProps;

const FeedContentBody = ({
  html,
  breakpoints,
  initialExpansionLevel = 0,
  linkToDocumentOnFinalExpand = true,
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
}: FeedContentBodyProps) => {

  const classes = useStyles(styles);
  const [expansionLevel, setExpansionLevel] = useState(initialExpansionLevel);
  
  const isMaxLevel = expansionLevel >= breakpoints.length - 1;
  const currentWordLimit = breakpoints[expansionLevel];

  const documentId = post?._id ?? comment?._id ?? tag?._id;


  const applyLineClamp = clampOverride !== undefined && clampOverride > 0 && expansionLevel === 0;
  // -------------------------------------------------------------

  let documentType: 'post' | 'comment' | 'tag';
  if (post) {
    documentType = 'post';
  } else if (comment) {
    documentType = 'comment';
  } else {
    documentType = 'tag';
  }

  const getDocumentUrl = () => {
    if (post) return postGetPageUrl(post);
    if (comment) return commentGetPageUrlFromIds({ postId: comment.postId, commentId: comment._id });
    if (tag) return `/tag/${tag._id}`;
    return '/';
  };

  const handleExpand = useCallback(() => {
    if (isMaxLevel) {
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

  const calculateTruncationState = () => {
    let truncatedHtml = html;
    let wasTruncated = false;
    let wordsLeft = 0;

    if (applyLineClamp) {
      wasTruncated = true; // assume truncated when line clamp is active
      wordsLeft = 0; // Not used when applyLineClamp is true, set to 0
      truncatedHtml = html; // Render full HTML for CSS clamping
    } else {
      // Word count truncation logic (applies if no clampOverride OR expansionLevel > 0)
      const createReadMoreSuffix = () => {
        if (hideSuffix || (isMaxLevel && linkToDocumentOnFinalExpand)) { 
           return '...';
        }
        const suffixContent = `...<span class="read-more-suffix">${readMoreSuffixText}</span>`;
        return suffixContent;
      };

      const result = truncateWithGrace(
        html,
        currentWordLimit,
        20, 
        wordCount,
        createReadMoreSuffix()
      );

      truncatedHtml = result.truncatedHtml;
      wasTruncated = result.wasTruncated;

      if (wasTruncated) {
         wordsLeft = Math.max(0, wordCount - currentWordLimit);
      } else {
         wordsLeft = 0;
      }
    }

    return { truncatedHtml, wasTruncated, wordsLeft };
  };

  const { truncatedHtml, wasTruncated, wordsLeft } = calculateTruncationState();

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

  const showContinueReadingLink = !applyLineClamp && isMaxLevel && wasTruncated && linkToDocumentOnFinalExpand;
  const isClickableForExpansion = !isMaxLevel;

  return (
    <div
      className={classNames(
        classes.root,
        className,
        isClickableForExpansion && classes.clickableContent 
      )}
      // Attach click handler if expansion is possible
      onClick={isClickableForExpansion ? handleContentClick : undefined}
    >
      <Components.ContentStyles contentType="ultraFeed">
        <div>
            <Components.ContentItemBody
              dangerouslySetInnerHTML={{ __html: truncatedHtml }}
              description={description || `${documentType} ${documentId}`}
              nofollow={nofollow}
              // Apply styles based on applyLineClamp
              className={classNames({
                [classes.maxHeight]: !applyLineClamp && !isMaxLevel && wasTruncated, // Max height for word trunc before max level
                [classes.lineClamp]: applyLineClamp && wasTruncated, // Line clamp style only when active
                [getLineClampClass()]: applyLineClamp && wasTruncated, // Specific line clamp class only when active
              })}
            />
        </div>

        {showContinueReadingLink && <div className={classes.continueReadingLinkContainer}>
            <Link
              to={getDocumentUrl()}
              className={classes.readMoreButton}
              eventProps={{intent: `expand${documentType.charAt(0).toUpperCase() + documentType.slice(1)}`}}
              onClick={(e) => e.stopPropagation()}
            >
            {`(Continue Reading – ${wordsLeft} words more)`}
          </Link>
      </div>}
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
