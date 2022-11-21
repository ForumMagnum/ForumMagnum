import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useMulti } from '../../lib/crud/withMulti';

interface PartitionedComments {
  approvedOrPending: CommentsList[];
  rejected: CommentsList[];
}

const PostsCommentsThread = ({ post, terms, newForm=true }: {
  post?: PostsDetails,
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
    return <Components.Loading />;
  } else if (!results) {
    return null;
  }

  if (post?.requireCommentApproval && results) {
    const approvedOrPendingComments: CommentsList[] = [];
    const rejectedComments: CommentsList[] = [];

    // results?.forEach((comment) => {
    //   if (!comment.commentApproval || comment.commentApproval.status === 'approved') {
    //     approvedOrPendingComments.push(comment);
    //   } else {
    //     rejectedComments.push(comment);
    //   }
    // });

    return (
      <>
        <Components.CommentsListSection
          comments={results}
          loadMoreComments={loadMore}
          totalComments={totalCount as number}
          commentCount={(results.length) || 0}
          loadingMoreComments={loadingMore}
          post={post}
          newForm={newForm}
          approvalSection='approved'
        />
        <Components.CommentsListSection
          comments={results}
          loadMoreComments={loadMore}
          totalComments={totalCount as number}
          commentCount={(results.length) || 0}
          loadingMoreComments={loadingMore}
          post={post}
          newForm={false}
          approvalSection='rejected'
        />
      </>
    );
  }

  return (
    <Components.CommentsListSection
      comments={results}
      loadMoreComments={loadMore}
      totalComments={totalCount as number}
      commentCount={(results && results.length) || 0}
      loadingMoreComments={loadingMore}
      post={post}
      newForm={newForm}
    />
  );
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
