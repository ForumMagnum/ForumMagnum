import React from 'react';
import { REVIEW_YEAR } from '../../lib/reviewUtils';
import { registerComponent } from '../../lib/vulcan-lib/components';
import CommentsNodeInner from "../comments/CommentsNode";
import { useQuery } from "@/lib/crud/useQuery";
import { gql } from "@/lib/crud/wrapGql";

const CommentsListWithParentMetadataMultiQuery = gql(`
  query multiCommentSingleLineReviewsListQuery($selector: CommentSelector, $limit: Int, $enableTotal: Boolean) {
    comments(selector: $selector, limit: $limit, enableTotal: $enableTotal) {
      results {
        ...CommentsListWithParentMetadata
      }
      totalCount
    }
  }
`);

const SingleLineReviewsList = () => {
  const { data } = useQuery(CommentsListWithParentMetadataMultiQuery, {
    variables: {
      selector: { reviews: { reviewYear: REVIEW_YEAR, sortBy: "new" } },
      limit: 3,
      enableTotal: false,
    },
    notifyOnNetworkStatusChange: true,
  });

  const results = data?.comments?.results;
  return <div>
    {results?.map(comment =>
        <div key={comment._id}>
          <CommentsNodeInner
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

export default registerComponent('SingleLineReviewsList', SingleLineReviewsList);


