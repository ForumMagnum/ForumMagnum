import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useMulti } from '../../lib/crud/withMulti';
import { unflattenComments } from "../../lib/utils/unflatten";

const PostsCommentsThread = ({ post, terms, newForm=true }: {
  post: PostsDetails,
  terms: CommentsViewTerms,
  newForm?: boolean,
}) => {
  const { loading, results, loadMore, loadingMore, totalCount } = useMulti({
    terms,
    collectionName: "Comments",
    fragmentName: 'CommentsList',
    fetchPolicy: 'cache-and-network',
    enableTotal: true,
  });
  
  if (loading && !results) {
    return <Components.Loading/>
  } else {
    const nestedComments = unflattenComments(results);
    return (
      <Components.CommentsListSection
        comments={nestedComments}
        loadMoreComments={loadMore}
        totalComments={totalCount as number}
        commentCount={(results && results.length) || 0}
        loadingMoreComments={loadingMore}
        post={post}
        newForm={newForm}
      />
    );
  }
}

const PostsCommentsThreadComponent = registerComponent('PostsCommentsThread', PostsCommentsThread, {
  areEqual: {
    terms: "deep",
  }
});

declare global {
  interface ComponentTypes {
    PostsCommentsThread: typeof PostsCommentsThreadComponent
  }
}

