import React, { useState } from 'react';
import { commentGetPageUrlFromIds } from '../../../lib/collections/comments/helpers';
import { useMulti } from '../../../lib/crud/withMulti';
import { Link } from '../../../lib/reactRouterWrapper';
import { registerComponent, Components } from '../../../lib/vulcan-lib';

const styles = (theme: ThemeType) => ({
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
  },
  linkIcon: {
    fontSize: "0.9rem",
    verticalAlign: "middle",
    color: theme.palette.icon.dim,
    margin: "0 2px",
    position: "relative",
    top: -2,
  }
});

export const RejectedCommentsList = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {
  const [expanded,setExpanded] = useState(false);
  const {
    RejectedReasonDisplay, FormatDate, MetaInfo, PostsTooltip, CommentBody,
    Row, ForumIcon,
  } = Components
  const { results, loadMoreProps } = useMulti({
    terms:{view: 'rejected', limit: 10},
    collectionName: "Comments",
    fragmentName: 'CommentsListWithParentMetadata',
    enableTotal: false,
  });
  
  return <div>
    {results?.map(comment =>
      <div key={comment._id}>
        <div className={classes.commentPadding} onClick={()=>setExpanded(true)}>
          <Row justifyContent="space-between">
            <MetaInfo>
              <FormatDate date={comment.postedAt}/>
            </MetaInfo>
            <PostsTooltip postId={comment.postId}>
              <MetaInfo>
                <Link to={commentGetPageUrlFromIds({postId: comment.postId, commentId: comment._id, postSlug: ""})}>
                  {comment.post?.draft && "[Draft] "}
                  {comment.post?.title} <ForumIcon icon="Link" className={classes.linkIcon} />
                </Link>
              </MetaInfo>
            </PostsTooltip>
            <span className={classes.reason}>
              <RejectedReasonDisplay reason={comment.rejectedReason}/>
            </span>
          </Row>
          <CommentBody truncated={!expanded} comment={comment} postPage={false} />
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

