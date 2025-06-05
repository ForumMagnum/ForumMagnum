import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { unflattenComments } from "../../lib/utils/unflatten";
import CommentsList from "../comments/CommentsList";
import Loading from "../vulcan-core/Loading";
import { useQuery } from "@/lib/crud/useQuery";
import { gql } from "@/lib/generated/gql-codegen/gql";

const CommentsListMultiQuery = gql(`
  query multiCommentRepliesToCommentListQuery($selector: CommentSelector, $limit: Int, $enableTotal: Boolean) {
    comments(selector: $selector, limit: $limit, enableTotal: $enableTotal) {
      results {
        ...CommentsList
      }
      totalCount
    }
  }
`);

const RepliesToCommentList = ({ post, parentCommentId, directReplies = false }: {
  post: PostsBase,
  parentCommentId: string,
  directReplies?: boolean
}) => {
  const terms: CommentsViewTerms = directReplies ? {
    view: "commentReplies",
    parentCommentId,
    limit: 500
  } : {
    view: "repliesToCommentThread",
    topLevelCommentId: parentCommentId,
    limit: 500,
  }
  const { view, limit, ...selectorTerms } = terms;
  const { data, loading } = useQuery(CommentsListMultiQuery, {
    variables: {
      selector: { [view]: selectorTerms },
      limit: limit ?? 10,
      enableTotal: false,
    },
    notifyOnNetworkStatusChange: true,
  });

  const results = data?.comments?.results;
  
  if (loading || !results)
    return <Loading/>
  
  const nestedComments = unflattenComments(results);
  return <CommentsList
    treeOptions={{
      post,
    }}
    totalComments={results.length}
    comments={nestedComments}
    startThreadTruncated={true}
    defaultNestingLevel={2}
    parentCommentId={parentCommentId}
  />
}


export default registerComponent('RepliesToCommentList', RepliesToCommentList);



