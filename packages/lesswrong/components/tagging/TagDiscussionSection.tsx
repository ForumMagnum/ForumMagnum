import React, { useState } from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import CommentsListSection from "../comments/CommentsListSection";
import { useQuery, NetworkStatus } from "@apollo/client";
import { useLoadMore } from "@/components/hooks/useLoadMore";
import { gql } from "@/lib/generated/gql-codegen/gql";

const CommentsListMultiQuery = gql(`
  query multiCommentTagDiscussionSectionQuery($selector: CommentSelector, $limit: Int, $enableTotal: Boolean) {
    comments(selector: $selector, limit: $limit, enableTotal: $enableTotal) {
      results {
        ...CommentsList
      }
      totalCount
    }
  }
`);

const styles = (theme: ThemeType) => ({
});

const TagDiscussionSection = ({classes, tag}: {
  classes: ClassesType<typeof styles>,
  tag: TagBasicInfo
}) => {
  const [highlightDate,setHighlightDate] = useState<Date|undefined>(undefined);
  
  const { data, loading, fetchMore, networkStatus } = useQuery(CommentsListMultiQuery, {
    variables: {
      selector: { tagDiscussionComments: { tagId: tag?._id } },
      limit: 500,
      enableTotal: true,
    },
    skip: !tag?._id,
    fetchPolicy: 'cache-and-network',
    notifyOnNetworkStatusChange: true,
  });

  const results = data?.comments?.results;

  const { loadMore } = useLoadMore({
    data: data?.comments,
    loading,
    fetchMore,
    initialLimit: 500,
    itemsPerPage: 10,
    enableTotal: true,
    resetTrigger: {
        view: "tagDiscussionComments",
        tagId: tag?._id,
        limit: 500,
      }
  });
  const totalCount = data?.comments?.totalCount;
  const loadingMore = networkStatus === NetworkStatus.fetchMore;
  
  if (!results)
    return null
  
  return (
    <CommentsListSection
      comments={results} tag={tag ? tag : undefined}
      loadMoreComments={loadMore}
      totalComments={totalCount as number}
      commentCount={(results?.length) || 0}
      loadingMoreComments={loadingMore}
      newForm={true}
      newFormProps={{enableGuidelines: false}}
      highlightDate={highlightDate}
      setHighlightDate={setHighlightDate}
    />
  );
}

export default registerComponent("TagDiscussionSection", TagDiscussionSection, {styles});



