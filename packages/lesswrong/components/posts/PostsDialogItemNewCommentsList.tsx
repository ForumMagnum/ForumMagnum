import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { CommentTreeOptions } from '../comments/commentTree';
import NoContent from "../common/NoContent";
import PostsItemNewCommentsListNode from "./PostsItemNewCommentsListNode";
import { useQuery } from "@apollo/client";
import { gql } from "@/lib/generated/gql-codegen/gql";

const CommentsListMultiQuery = gql(`
  query multiCommentPostsDialogItemNewCommentsListQuery($selector: CommentSelector, $limit: Int, $enableTotal: Boolean) {
    comments(selector: $selector, limit: $limit, enableTotal: $enableTotal) {
      results {
        ...CommentsList
      }
      totalCount
    }
  }
`);

const styles = (theme: ThemeType) => ({})

const PostsDialogItemNewCommentsList = ({ terms, post, treeOptions }: {
  terms: CommentsViewTerms,
  classes: ClassesType<typeof styles>,
  post: PostsList & { debate: true },
  treeOptions: CommentTreeOptions,
}) => {
  const { view, limit, ...selectorTerms } = terms;
  const { data, loading } = useQuery(CommentsListMultiQuery, {
    variables: {
      selector: { [view]: selectorTerms },
      limit: 5,
      enableTotal: false,
    },
    fetchPolicy: 'cache-first',
    notifyOnNetworkStatusChange: true,
  });

  const results = data?.comments?.results;

  const { data: dataCommentsList, loading: debateResponsesLoading } = useQuery(CommentsListMultiQuery, {
    variables: {
      selector: { recentDebateResponses: { postId: post._id } },
      limit: 2,
      enableTotal: false,
    },
    notifyOnNetworkStatusChange: true,
  });

  const debateResponses = dataCommentsList?.comments?.results;
  const noCommentsFound = !loading && results && !results.length;
  const noDebateResponsesFound = !debateResponsesLoading && debateResponses && !debateResponses.length;

  if (noCommentsFound && noDebateResponsesFound) {
    return <NoContent>No comments found</NoContent>
  } 
  
  else {
    const commentsNodeProps: React.ComponentProps<typeof PostsItemNewCommentsListNode> = {
      commentsList: results,
      loadingState: loading,
      post,
      treeOptions,
      title: 'User Comments'
    };

    const dialogResponsesNodeProps: React.ComponentProps<typeof PostsItemNewCommentsListNode> = {
      commentsList: debateResponses,
      loadingState: debateResponsesLoading,
      post,
      treeOptions,
      title: 'Dialog Responses',
      reverseOrder: true
    };

    return <div>
      <PostsItemNewCommentsListNode {...dialogResponsesNodeProps} />
      <PostsItemNewCommentsListNode {...commentsNodeProps} />
    </div>;
  }
};

export default registerComponent(
  'PostsDialogItemNewCommentsList', PostsDialogItemNewCommentsList, {
    styles,
  }
);


