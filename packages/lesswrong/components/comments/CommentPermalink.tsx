import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useSingle } from '../../lib/crud/withSingle';
import { forumTypeSetting } from '../../lib/instanceSettings';

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

const CommentPermalink = ({ documentId, post, classes }: {
  documentId: string,
  post: PostsList,
  classes: ClassesType,
}) => {
  const { document: comment, data, loading, error } = useSingle({
    documentId,
    collectionName: "Comments",
    fragmentName: 'CommentWithRepliesFragment',
  });
  const refetch = data?.refetch;
  const { Loading, Divider, CommentWithReplies } = Components;

  if (error || (!comment && !loading)) return <div>Comment not found</div>

  if (!documentId) return null

  // NB: classes.root is not in the above styles, but is used by eaTheme
  return <div className={classes.root}>
      <div className={classes.permalinkLabel}>Comment Permalink</div>
      {loading ? <Loading /> : <div>
        <CommentWithReplies key={comment._id} post={post} comment={comment} refetch={refetch} expandByDefault showTitle={false}/>
        <div className={classes.seeInContext}><a href={`#${documentId}`}>See in context</a></div>
      </div>}
      {forumTypeSetting.get() !== 'EAForum' && <div className={classes.dividerMargins}><Divider /></div>}
    </div>
}

const CommentPermalinkComponent = registerComponent("CommentPermalink", CommentPermalink, { styles });


declare global {
  interface ComponentTypes {
    CommentPermalink: typeof CommentPermalinkComponent,
  }
}
