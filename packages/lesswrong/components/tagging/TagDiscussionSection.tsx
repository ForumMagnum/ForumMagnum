import React, { useState } from 'react';
import CommentsListSection from "../comments/CommentsListSection";
import { NetworkStatus } from "@apollo/client";
import { useQueryWithLoadMore } from "@/components/hooks/useQueryWithLoadMore";
import { gql } from "@/lib/generated/gql-codegen";
import { defineStyles } from '@/components/hooks/defineStyles';
import { useStyles } from '@/components/hooks/useStyles';

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

const styles = defineStyles("TagDiscussionSection", (theme: ThemeType) => ({
}));

const TagDiscussionSection = ({tag}: {
  tag: TagBasicInfo
}) => {
  const classes = useStyles(styles);
  const [highlightDate,setHighlightDate] = useState<Date|undefined>(undefined);
  
  const { data, networkStatus, loadMoreProps } = useQueryWithLoadMore(CommentsListMultiQuery, {
    variables: {
      selector: { tagDiscussionComments: { tagId: tag?._id } },
      limit: 500,
      enableTotal: true,
    },
    skip: !tag?._id,
    fetchPolicy: 'cache-and-network',
  });

  const results = data?.comments?.results;
  const { loadMore } = loadMoreProps;
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

export default TagDiscussionSection;



