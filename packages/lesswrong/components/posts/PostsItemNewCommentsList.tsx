import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { CommentTreeOptions } from '../comments/commentTree';
import NoContent from "../common/NoContent";
import PostsItemNewCommentsListNode from "./PostsItemNewCommentsListNode";
import { useQuery } from "@apollo/client";
import { gql } from "@/lib/generated/gql-codegen/gql";

const CommentsListMultiQuery = gql(`
  query multiCommentPostsItemNewCommentsListQuery($selector: CommentSelector, $limit: Int, $enableTotal: Boolean) {
    comments(selector: $selector, limit: $limit, enableTotal: $enableTotal) {
      results {
        ...CommentsList
      }
      totalCount
    }
  }
`);

const styles = (theme: ThemeType) => ({})

const PostsItemNewCommentsList = ({ terms, post, treeOptions }: {
  terms: CommentsViewTerms,
  classes: ClassesType<typeof styles>,
  post: PostsList,
  treeOptions: CommentTreeOptions,
}) => {
  const { view, limit, ...selectorTerms } = terms;
  const { data, loading } = useQuery(CommentsListMultiQuery, {
    variables: {
      selector: { [view]: selectorTerms },
      limit: terms.limit ?? 5,
      enableTotal: false,
    },
    fetchPolicy: 'cache-first',
    notifyOnNetworkStatusChange: true,
  });

  const results = data?.comments?.results;
  const noCommentsFound = !loading && results && !results.length;

  if (noCommentsFound) {
    return <NoContent>No comments found</NoContent>
  }
  
  else {
    const props: React.ComponentProps<typeof PostsItemNewCommentsListNode> = {
      commentsList: results,
      loadingState: loading,
      post,
      treeOptions
    };

    return <PostsItemNewCommentsListNode {...props} />;
  }
};

export default registerComponent(
  'PostsItemNewCommentsList', PostsItemNewCommentsList, {
    styles,
  }
);


