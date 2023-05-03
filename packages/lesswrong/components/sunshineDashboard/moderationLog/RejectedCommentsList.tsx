
import React from 'react';
import { commentGetPageUrlFromIds } from '../../../lib/collections/comments/helpers';
import { useMulti } from '../../../lib/crud/withMulti';
import { Link } from '../../../lib/reactRouterWrapper';
import { registerComponent, Components } from '../../../lib/vulcan-lib';

const styles = (theme: ThemeType): JssStyles => ({
  commentPadding: {
    padding: 16,
    paddingTop: 12,
    borderRadius: 3,
    border: theme.palette.border.commentBorder,
    background: theme.palette.background.pageActiveAreaBackground,
    marginBottom: 24
  },
  reason: {
    marginLeft: "auto"
  }
});

export const RejectedCommentsList = ({classes}: {
  classes: ClassesType,
}) => {
  const { RejectedReason, FormatDate, MetaInfo, LWTooltip, PostsPreviewTooltipSingle, CommentBody, Row } = Components
  const { results, loadMoreProps } = useMulti({
    terms:{view: 'rejected', limit: 10},
    collectionName: "Comments",
    fragmentName: 'CommentsListWithParentMetadata',
    enableTotal: false,
  });
  
  return <div className={classes.root}>
    {results?.map(comment =>
      <div key={comment._id}>
        <div className={classes.commentPadding}>
          <Row justifyContent="space-between">
            <MetaInfo>
              <FormatDate date={comment.postedAt}/>
            </MetaInfo>
            <LWTooltip tooltip={false} title={<PostsPreviewTooltipSingle postId={comment.postId}/>}>
              <MetaInfo>
                <Link className={classes.postTitle} to={commentGetPageUrlFromIds({postId: comment.postId, commentId: comment._id, postSlug: ""})}>
                  {comment.post?.draft && "[Draft] "}
                  {comment.post?.title}
                </Link>
              </MetaInfo>
            </LWTooltip>
            <span className={classes.reason}>
              <RejectedReason reason={comment.rejectedReason}/>
            </span>
          </Row>
          <CommentBody truncated={true} comment={comment} postPage={false} />
        </div>
      </div>
    )}
    <Components.LoadMore {...loadMoreProps} />
  </div>;
}

const RejectedCommentsListComponent = registerComponent('RejectedCommentsList', RejectedCommentsList, {styles});

declare global {
  interface ComponentTypes {
    RejectedCommentsList: typeof RejectedCommentsListComponent
  }
}

