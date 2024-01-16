import React from 'react';
import { commentIsHidden } from '../../lib/collections/comments/helpers';
import { postGetPageUrl } from '../../lib/collections/posts/helpers';
import { useSingle } from '../../lib/crud/withSingle';
import { isLWorAF } from '../../lib/instanceSettings';
import { useLocation, useNavigate } from '../../lib/routeUtil';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useExpandAllContext } from '../common/ExpandOnSearchHotkeyPageWrapper';
import { getCurrentSectionMark, getLandmarkY } from '../hooks/useScrollHighlight';
import { commentIdToLandmark } from './CommentsTableOfContents';
import isEmpty from 'lodash/isEmpty';
import qs from 'qs'

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    ...theme.typography.body2,
    ...theme.typography.commentStyle,
  },
  dividerMargins: {
    marginTop: 150,
    marginBottom: 150,
  },
  permalinkLabel: {
    color: theme.palette.grey[600],
    marginBottom: theme.spacing.unit*2,
    marginLeft: 10,
    [theme.breakpoints.down('md')]: {
      marginTop: theme.spacing.unit*2
    }
  },
  seeInContext: {
    textAlign: "right",
    color: theme.palette.lwTertiary.main,
    marginRight: 10
  },
})

const getCommentDescription = (comment: CommentWithRepliesFragment) => {
  if (comment.deleted) return '[Comment deleted]'

  return `Comment ${comment.user ? 
    `by ${comment.user.displayName} ` : 
    ''
  }- ${comment.contents?.plaintextMainText}`
}

const CommentPermalink = ({ documentId, post, classes }: {
  documentId: string,
  post?: PostsDetails,
  classes: ClassesType,
}) => {
  const { document: comment, data, loading, error } = useSingle({
    documentId,
    collectionName: "Comments",
    fragmentName: 'CommentWithRepliesFragment',
  });
  const refetch = data?.refetch;
  const { Loading, Divider, CommentOnPostWithReplies, HeadTags, CommentWithReplies } = Components;
  const { expandAll } = useExpandAllContext()!;
  const navigate = useNavigate();
  const location = useLocation();
  const { query } = location;

  if (error || (!comment && !loading)) return <div>Comment not found</div>
  
  if (loading) return <Loading />

  if (!comment) {return null}

  if (!documentId) return null
  
  // if the site is currently hiding comments by unreviewed authors, check if we need to hide this comment
  if (commentIsHidden(comment) && !comment.rejected) return <div className={classes.root}>
    <div className={classes.permalinkLabel}>
      Comment Permalink 
      <p>Error: Sorry, this comment is hidden</p>
    </div>
    {isLWorAF && <div className={classes.dividerMargins}>
      <Divider />
    </div>}
  </div>

  const ogUrl = post ? postGetPageUrl(post, true) : undefined // open graph
  const canonicalUrl = post ? post.canonicalSource || ogUrl : undefined
  // For imageless posts this will be an empty string
  const socialPreviewImageUrl = post ? post.socialPreviewData?.imageUrl : undefined

  const commentNodeProps = {
    treeOptions: {
      refetch,
      showPostTitle: false,
    },
    forceUnTruncated: true,
    forceUnCollapsed: true,
    noAutoScroll: true
  };
  
  function scrollToComment() {
    const commentTop = getLandmarkY(commentIdToLandmark(documentId));
    if (commentTop) {
      // Add window.scrollY because window.scrollTo takes a relative scroll distance
      // rather than an absolute scroll position, and a +1 because of rounding issues
      // that otherwise cause us to wind up just above the comment such that the ToC
      // highlights the wrong one.
      const y = commentTop + window.scrollY - getCurrentSectionMark() + 1;
      window.scrollTo({ top: y, behavior: "auto" });
    }
  }
  function clickSeeInContext(ev: React.MouseEvent) {
    if (hashLinkExistsOnPage(documentId)) {
      scrollToComment();
    } else {
      expandAll();
      setTimeout(() => {
        scrollToComment();
      }, 0);
    }
    navigate({
      search: isEmpty(query) ? '' : `?${qs.stringify(query)}`,
      hash: `#${documentId}`,
    });
    ev.preventDefault();
  }

  // NB: classes.root is not in the above styles, but is used by eaTheme
  return (
    <div className={classes.root}>
      <div className={classes.permalinkLabel}>Comment Permalink</div>
      <div>
        <HeadTags
          ogUrl={ogUrl}
          canonicalUrl={canonicalUrl}
          image={socialPreviewImageUrl}
          description={getCommentDescription(comment)}
          noIndex={true}
        />
        {post ? (
          <CommentOnPostWithReplies
            key={comment._id}
            post={post}
            comment={comment}
            commentNodeProps={commentNodeProps}
          />
        ) : (
          <CommentWithReplies
            key={comment._id}
            comment={comment}
            commentNodeProps={commentNodeProps}
            initialMaxChildren={5}
          />
        )}
        <div className={classes.seeInContext}>
          <a href={`#${documentId}`} onClick={clickSeeInContext}>See in context</a>
        </div>
      </div>
      {isLWorAF && <div className={classes.dividerMargins}>
        <Divider />
      </div>}
    </div>
  );
}

function hashLinkExistsOnPage(hash: string) {
  return !!document.getElementById(hash);
}

const CommentPermalinkComponent = registerComponent("CommentPermalink", CommentPermalink, { styles });


declare global {
  interface ComponentTypes {
    CommentPermalink: typeof CommentPermalinkComponent,
  }
}
