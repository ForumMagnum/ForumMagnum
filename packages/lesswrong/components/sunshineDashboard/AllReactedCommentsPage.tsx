"use client";

import React from 'react';
import SingleColumnSection from "../common/SingleColumnSection";
import SectionTitle from "../common/SectionTitle";
import CommentsNode from "../comments/CommentsNode";
import LoadMore from "../common/LoadMore";
import { gql } from '@/lib/generated/gql-codegen';
import { useQueryWithLoadMore } from '../hooks/useQueryWithLoadMore';
import { defineStyles } from '@/components/hooks/defineStyles';
import { useStyles } from '@/components/hooks/useStyles';

const styles = defineStyles('AllReactedCommentsPage', (theme: ThemeType) => ({
  root: {
  }
}));

export const AllReactedCommentsPage = () => {
  const classes = useStyles(styles);
  const defaultLimit = 50;
  const pageSize = 50

  const { data, loadMoreProps } = useQueryWithLoadMore(gql(`
    query AllReactedComments($limit: Int) {
      CommentsWithReacts(limit: $limit) {
        results {
          ...CommentsListWithParentMetadata
        }
      }
    }
  `), {
    variables: { limit: defaultLimit },
    fetchPolicy: "cache-and-network",
    nextFetchPolicy: "cache-first",
    itemsPerPage: pageSize,
  });

  const results = data?.CommentsWithReacts?.results;
  
  return (
    <SingleColumnSection>
      <SectionTitle title="All Reacted Comments"/>
      <div className={classes.root}>
        {results && results.map((comment: CommentsListWithParentMetadata) =>
          <div key={comment._id}>
            <CommentsNode
              treeOptions={{
                condensed: false,
                post: comment.post || undefined,
                tag: comment.tag || undefined,
                showPostTitle: true,
                forceNotSingleLine: true
              }}
              comment={comment}
            />
          </div>
        )}
        <LoadMore {...loadMoreProps}/>
      </div>
    </SingleColumnSection>
  )
}

export default AllReactedCommentsPage;


