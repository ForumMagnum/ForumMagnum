import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import SingleColumnSection from "../common/SingleColumnSection";
import SectionTitle from "../common/SectionTitle";
import CommentsNodeInner from "../comments/CommentsNode";
import LoadMore from "../common/LoadMore";
import { useQuery } from '@apollo/client';
import { gql } from '@/lib/generated/gql-codegen';
import { useLoadMore } from '../hooks/useLoadMore';

const styles = (theme: ThemeType) => ({
  root: {
  }
});

export const AllReactedCommentsPage = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {
  const defaultLimit = 50;
  const pageSize = 50

  const { data, loading, fetchMore } = useQuery(gql(`
    query AllReactedComments($limit: Int) {
      CommentsWithReacts(limit: $limit) {
        results {
          ...CommentsListWithParentMetadata
        }
      }
    }
  `), {
    variables: { limit: defaultLimit },
    pollInterval: 0,
    fetchPolicy: "cache-and-network",
    nextFetchPolicy: "cache-only",
  });

  const results = data?.CommentsWithReacts?.results;

  const loadMoreProps = useLoadMore({
    data: data?.CommentsWithReacts,
    loading,
    fetchMore,
    initialLimit: defaultLimit,
    itemsPerPage: pageSize,
  });
  
  return (
    <SingleColumnSection>
      <SectionTitle title="All Reacted Comments"/>
      <div className={classes.root}>
        {results && results.map((comment: CommentsListWithParentMetadata) =>
          <div key={comment._id}>
            <CommentsNodeInner
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

export default registerComponent('AllReactedCommentsPage', AllReactedCommentsPage, {styles});


