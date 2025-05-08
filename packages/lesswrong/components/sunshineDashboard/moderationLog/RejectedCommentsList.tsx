import React, { useState } from 'react';
import { commentGetPageUrlFromIds } from '../../../lib/collections/comments/helpers';
import { useMulti } from '../../../lib/crud/withMulti';
import { Link } from '../../../lib/reactRouterWrapper';
import { registerComponent } from '../../../lib/vulcan-lib/components';
import { LoadMore } from "../../common/LoadMore";
import { RejectedReasonDisplay } from "../RejectedReasonDisplay";
import { FormatDate } from "../../common/FormatDate";
import { MetaInfo } from "../../common/MetaInfo";
import { PostsTooltip } from "../../posts/PostsPreviewTooltip/PostsTooltip";
import { CommentBody } from "../../comments/CommentsItem/CommentBody";
import { Row } from "../../common/Row";
import { ForumIcon } from "../../common/ForumIcon";

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

export const RejectedCommentsListInner = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {
  const [expanded,setExpanded] = useState(false);
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
            <PostsTooltip postId={comment.postId ?? undefined}>
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
    <LoadMore {...loadMoreProps} />
  </div>;
}

export const RejectedCommentsList = registerComponent('RejectedCommentsList', RejectedCommentsListInner, {styles});

declare global {
  interface ComponentTypes {
    RejectedCommentsList: typeof RejectedCommentsList
  }
}

