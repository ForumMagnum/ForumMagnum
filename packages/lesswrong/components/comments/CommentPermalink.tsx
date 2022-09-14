import React from 'react';
import { postGetPageUrl } from '../../lib/collections/posts/helpers';
import { useSingle } from '../../lib/crud/withSingle';
import { forumTypeSetting } from '../../lib/instanceSettings';
import { Components, registerComponent } from '../../lib/vulcan-lib';

const styles = (theme: ThemeType): JssStyles => ({
  dividerMargins: {
    marginTop: 150,
    marginBottom: 150,
  },
  permalinkLabel: {
    ...theme.typography.body2,
    ...theme.typography.commentStyle,
    color: theme.palette.grey[600],
    marginBottom: theme.spacing.unit*2,
    marginLeft: 10,
    [theme.breakpoints.down('md')]: {
      marginTop: theme.spacing.unit*2
    }
  },
  seeInContext: {
    ...theme.typography.body2,
    ...theme.typography.commentStyle,
    textAlign: "right",
    color: theme.palette.lwTertiary.main,
    marginRight: 10
  },
})

const getCommentDescription = (comment: CommentWithRepliesFragment) => {
  return `Comment ${comment.user ? 
    `by ${comment.user.displayName} ` : 
    ''
  }- ${comment.contents?.plaintextMainText}`
}

const CommentPermalink = ({ documentId, post, classes }: {
  documentId: string,
  post: PostsDetails,
  classes: ClassesType,
}) => {
  const { document: comment, data, loading, error } = useSingle({
    documentId,
    collectionName: "Comments",
    fragmentName: 'CommentWithRepliesFragment',
  });
  const refetch = data?.refetch;
  const { Loading, Divider, CommentOnPostWithReplies, HeadTags } = Components;

  if (error || (!comment && !loading)) return <div>Comment not found</div>
  
  if (loading) return <Loading />

  if (!comment) {return null}

  if (!documentId) return null

  const ogUrl = postGetPageUrl(post, true) // open graph
  const canonicalUrl = post.canonicalSource || ogUrl
  // For imageless posts this will be an empty string
  const socialPreviewImageUrl = post.socialPreviewImageUrl

  // NB: classes.root is not in the above styles, but is used by eaTheme
  return <div className={classes.root}>
      <div className={classes.permalinkLabel}>Comment Permalink</div>
      <div>
        <HeadTags ogUrl={ogUrl} canonicalUrl={canonicalUrl} image={socialPreviewImageUrl} 
        description={getCommentDescription(comment)} noIndex={true} />
        <CommentOnPostWithReplies key={comment._id} post={post} comment={comment} commentNodeProps={{
          treeOptions: {
            refetch,
            showPostTitle: false,
          },
          expandByDefault: true,
        }}/>
        <div className={classes.seeInContext}><a href={`#${documentId}`}>See in context</a></div>
      </div>
      {forumTypeSetting.get() !== 'EAForum' && <div className={classes.dividerMargins}><Divider /></div>}
    </div>
}

const CommentPermalinkComponent = registerComponent("CommentPermalink", CommentPermalink, { styles });


declare global {
  interface ComponentTypes {
    CommentPermalink: typeof CommentPermalinkComponent,
  }
}
