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
    '& .read-more-button': {
      fontFamily: theme.palette.fonts.sansSerifStack,
      color: theme.palette.text.dim60,
      cursor: 'pointer',
      opacity: 0.8,
      display: 'inline',
      marginLeft: 0,
      '&:hover': {
        opacity: 1,
        textDecoration: 'none',
      },
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
    // // maxHeight: 600,
    // overflow: 'hidden',
  },
  lineClamp: {
    display: '-webkit-box !important',
    '-webkit-box-orient': 'vertical !important',
    overflow: 'hidden !important',
    // textOverflow: 'ellipsis !important',
    maxHeight: 'none !important',
    // TOOD: remove for now to avoid weird sudden clipping of text (I believe this was to give room for danglers?)
    // paddingBottom: '0.25em !important',
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

// Define the three possible entity configurations
type PostProps = { post: PostsList; comment?: never; tag?: never };
type CommentProps = { post?: never; comment: CommentsList; tag?: never };
type TagProps = { post?: never; comment?: never; tag: TagBasicInfo };

// Union type to ensure exactly one entity is provided
type DocumentProps = PostProps | CommentProps | TagProps;

// Main component props
interface BaseFeedContentBodyProps {
  /** HTML content */
  html: string;
  /** Word count breakpoints for expansion levels */
  breakpoints: number[];
  /** Initial expansion level index */
  initialExpansionLevel?: number;
  /** Link to entity page on final expand */
  linkToDocumentOnFinalExpand?: boolean;
  /** Total word count */
  wordCount: number;
  /** Expansion callback */
  onExpand?: (level: number, maxLevelReached: boolean, wordCount: number) => void;
  /** Description for ContentItemBody */
  description?: string;
  /** Add nofollow to links */
  nofollow?: boolean;
  /** Additional styling */
  className?: string;
  /** Override word truncation with line clamping (number of lines) */
  clampOverride?: number;
}

// Combined props type
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
}: FeedContentBodyProps) => {

  const classes = useStyles(styles);
  const [expansionLevel, setExpansionLevel] = useState(initialExpansionLevel);
  
  const isMaxLevel = expansionLevel >= breakpoints.length - 1;
  const currentWordLimit = breakpoints[expansionLevel];
  const isFirstLevel = expansionLevel === 0;
  
  // Add logging at the start of render
  // console.log('[FeedContentBody Render]', {
  //   documentId: post?._id || comment?._id || tag?._id,
  //   expansionLevel,
  //   currentWordLimit,
  //   isMaxLevel,
  //   isFirstLevel,
  //   wordCount,
  //   breakpoints
  // });
  
  // Determine entity type and ID
  const documentType = post ? 'post' : comment ? 'comment' : 'tag';
  const documentId = post?._id || comment?._id || tag?._id;
  
  const getDocumentUrl = () => {
    if (post) return postGetPageUrl(post);
    if (comment) return commentGetPageUrlFromIds({
      postId: comment.postId,
      commentId: comment._id
    });
    if (tag) return `/tag/${tag._id}`;
    return '/';
  };
  
  const handleExpand = useCallback(() => {
    const docId = post?._id || comment?._id || tag?._id;
    console.log('[FeedContentBody handleExpand Start]', { docId, currentExpansionLevel: expansionLevel, isMaxLevel });

    if (isMaxLevel && linkToDocumentOnFinalExpand) {
        console.log('[FeedContentBody handleExpand] At max level and linking out, returning.');
        return;
    }

    const newLevel = Math.min(expansionLevel + 1, breakpoints.length - 1);
    const newMaxReached = newLevel >= breakpoints.length - 1;
    setExpansionLevel(newLevel);
    onExpand?.(newLevel, newMaxReached, wordCount);
    console.log('[FeedContentBody handleExpand End]', { docId, newLevel });

  }, [
    expansionLevel,
    breakpoints.length,
    onExpand,
    isMaxLevel,
    linkToDocumentOnFinalExpand,
    wordCount,
    post, comment, tag
  ]);
  
  // Handle clicks on the content area
  const handleContentClick = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement;

    // Check 1: Is it the explicit "read-more-button"? Expand and stop.
    if (target.classList.contains('read-more-button') || target.closest('.read-more-button')) {
      // console.log("in FeedContentBody handleContentClick, if read more button, stage 1");
      e.stopPropagation(); // Prevent link navigation if button is inside a link
      handleExpand();
      return;
    }

    // Check 2: Is the click target itself or its immediate parent an anchor tag?
    // If so, do nothing and let the browser handle the link navigation.
    if (target.tagName === 'A' || target.parentElement?.tagName === 'A') {
      // console.log("Clicked on a link, allowing default navigation.");
      // Do not call e.stopPropagation()
      // Do not call handleExpand()
      return;
    }

    // Check 3: Otherwise, it's a click on general content. Trigger expansion.
    // console.log("in FeedContentBody handleContentClick, general click");
    // No need to check isFirstLevel anymore
    handleExpand();

  }, [handleExpand]); // Remove isFirstLevel from dependency array
  
  // Using line clamp or word truncation based on the clampOverride prop
  const usingLineClamp = clampOverride !== undefined && clampOverride > 0;
  
  // Process the HTML content only if not using line clamp
  let truncatedHtml = html;
  let wasTruncated = false;
  let wordsLeft = 0;
  
  if (!usingLineClamp) {
    // Add read-more button directly to the HTML for non-max levels
    const createReadMoreSuffix = () => {
      if (isMaxLevel && linkToDocumentOnFinalExpand) {
        // Don't add inline suffix if we're showing an external link button
        return '...';
      }
      // Use a placeholder that will be replaced after we know wordsLeft
      return `...<span class="read-more-button" data-expansion-level="${expansionLevel}">(read more)</span>`;
    };
    
    // Process the HTML content
    const result = truncateWithGrace(
      html,
      currentWordLimit,
      20,
      wordCount,
      createReadMoreSuffix()
    );
    
    truncatedHtml = result.truncatedHtml;
    wasTruncated = result.wasTruncated;
    wordsLeft = result.wordsLeft;
    
    // Direct check to ensure we correctly identify if content is truncated
    // This handles cases where truncateWithGrace might not accurately report truncation
    if (wordCount > currentWordLimit && !wasTruncated) {
      wasTruncated = true;
      wordsLeft = wordCount - currentWordLimit;
    }
  } else {
    // For line clamp mode, assume there's more content if word count exceeds a threshold
    // (This is an estimate since we can't know exactly without rendering)
    wasTruncated = wordCount > currentWordLimit;
    wordsLeft = wordCount - currentWordLimit;
  }
  
  // Get the appropriate line clamp class based on the clampOverride value
  const getLineClampClass = () => {
    if (!usingLineClamp || !clampOverride) return "";
    
    // Map the clamp override to predefined classes
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
        // For values we don't have specific classes for, use lineClamp4 as a default
        console.warn(`No specific class for line clamp value: ${clampOverride}, using default`);
        return classes.lineClamp4;
    }
  };
  
  // Only show external link button if:
  // - We're at max level 
  // - There's more content to show
  // - We're configured to link to full content
  const showContinueReadingLink = isMaxLevel && wasTruncated && linkToDocumentOnFinalExpand;

  return (
    <div 
      className={classNames(
        classes.root, 
        className,
        (wasTruncated && isFirstLevel) && classes.clickableContent
      )}
      onClick={handleContentClick}
    >
      <Components.ContentStyles contentType="ultraFeed">
        <Components.ContentItemBody
          dangerouslySetInnerHTML={{ __html: truncatedHtml }}
          description={description || `${documentType} ${documentId}`}
          nofollow={nofollow}
          className={classNames({
            [classes.maxHeight]: !isMaxLevel && wasTruncated && !usingLineClamp,
            [classes.lineClamp]: usingLineClamp,
            [getLineClampClass()]: usingLineClamp,
          })}
        />
        
        {showContinueReadingLink && <div className={classes.continueReadingLinkContainer}>
            <Link 
              to={getDocumentUrl()} 
              className={classes.readMoreButton}
              eventProps={{intent: `expand${documentType.charAt(0).toUpperCase() + documentType.slice(1)}`}}
          >
            (Continue Reading – {wordsLeft} words more)
          </Link>
      </div>}
      </Components.ContentStyles>
      
      {/* {usingLineClamp && wasTruncated && !isMaxLevel && (
        <span 
          className={classes.readMoreButton}
          onClick={(e) => {
            console.log("in FeedContentBody read more, stage 1");
            e.stopPropagation();
            handleExpand();
          }}
        >
          Read more 77
        </span>
      )} */}
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
