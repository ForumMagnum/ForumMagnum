import React from 'react';
import { commentIsHidden } from '../../lib/collections/comments/helpers';
import { postGetPageUrl } from '../../lib/collections/posts/helpers';
import { useSingle } from '../../lib/crud/withSingle';
import { forumTypeSetting } from '../../lib/instanceSettings';
import { Components, registerComponent } from '../../lib/vulcan-lib';

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

  if (error || (!comment && !loading)) return <div>Comment not found</div>
  
  if (loading) return <Loading />

  if (!comment) {return null}

  if (!documentId) return null
  
  // if the site is currently hiding comments by unreviewed authors, check if we need to hide this comment
  if (commentIsHidden(comment)) return <div className={classes.root}>
    <div className={classes.permalinkLabel}>
      Comment Permalink 
      <p>Error: Sorry, this comment is hidden</p>
    </div>
    {forumTypeSetting.get() !== "EAForum" && (
      <div className={classes.dividerMargins}>
        <Divider />
      </div>
    )}
  </div>

  const ogUrl = post ? postGetPageUrl(post, true) : undefined // open graph
  const canonicalUrl = post ? post.canonicalSource || ogUrl : undefined
  // For imageless posts this will be an empty string
  const socialPreviewImageUrl = post ? post.socialPreviewImageUrl : undefined

  const commentNodeProps = {
    treeOptions: {
      refetch,
      showPostTitle: false,
    },
    forceUnTruncated: true,
    forceUnCollapsed: true,
    noAutoScroll: true
  };

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
          <a href={`#${documentId}`}>See in context</a>
        </div>
      </div>
      {forumTypeSetting.get() !== "EAForum" && (
        <div className={classes.dividerMargins}>
          <Divider />
        </div>
      )}
    </div>
  );
}

const CommentPermalinkComponent = registerComponent("CommentPermalink", CommentPermalink, { styles });


declare global {
  interface ComponentTypes {
    CommentPermalink: typeof CommentPermalinkComponent,
  }
}
