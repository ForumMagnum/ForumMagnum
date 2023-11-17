import React from 'react';
import { useMulti } from '../../lib/crud/withMulti';
import { REVIEW_YEAR } from '../../lib/reviewUtils';
import { Components, registerComponent } from '../../lib/vulcan-lib';

const SingleLineReviewsList = () => {
  const { results } = useMulti({
    terms: { view: "reviews", reviewYear: REVIEW_YEAR, sortBy: "new"},
    collectionName: "Comments",
    fragmentName: 'CommentsListWithParentMetadata',
    enableTotal: false,
    limit: 3
  });
  return <div>
    {results?.map(comment =>
        <div key={comment._id}>
          <Components.CommentsNode
            treeOptions={{
              condensed: true,
              singleLineCollapse: true,
              hideSingleLineMeta: true,
              singleLinePostTitle: true,
              showPostTitle: true,
              post: comment.post || undefined,
              forceSingleLine: true
            }}
            comment={comment}
          />
        </div>
      )}
  </div>
}

const SingleLineReviewsListComponent = registerComponent('SingleLineReviewsList', SingleLineReviewsList);

declare global {
  interface ComponentTypes {
    SingleLineReviewsList: typeof SingleLineReviewsListComponent
  }
}
