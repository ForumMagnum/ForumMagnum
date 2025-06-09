import React, { useState } from 'react';
import { commentGetPageUrlFromIds } from '../../../lib/collections/comments/helpers';
import { Link } from '../../../lib/reactRouterWrapper';
import { registerComponent } from '../../../lib/vulcan-lib/components';
import LoadMore from "../../common/LoadMore";
import RejectedReasonDisplay from "../RejectedReasonDisplay";
import FormatDate from "../../common/FormatDate";
import MetaInfo from "../../common/MetaInfo";
import PostsTooltip from "../../posts/PostsPreviewTooltip/PostsTooltip";
import CommentBody from "../../comments/CommentsItem/CommentBody";
import Row from "../../common/Row";
import ForumIcon from "../../common/ForumIcon";
import { useQueryWithLoadMore } from "@/components/hooks/useQueryWithLoadMore";
import { gql } from "@/lib/generated/gql-codegen";

const CommentsListWithParentMetadataMultiQuery = gql(`
  query multiCommentRejectedCommentsListQuery($selector: CommentSelector, $limit: Int, $enableTotal: Boolean) {
    comments(selector: $selector, limit: $limit, enableTotal: $enableTotal) {
      results {
        ...CommentsListWithParentMetadata
      }
      totalCount
    }
  }
`);

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
  const { data, loadMoreProps } = useQueryWithLoadMore(CommentsListWithParentMetadataMultiQuery, {
    variables: {
      selector: { rejected: {} },
      limit: 10,
      enableTotal: false,
    },
  });

  const results = data?.comments?.results;
  
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

export default registerComponent('RejectedCommentsList', RejectedCommentsList, {styles});



