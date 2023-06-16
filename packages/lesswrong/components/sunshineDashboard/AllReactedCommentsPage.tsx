import React, { useState } from 'react';
import {Components, fragmentTextForQuery, registerComponent} from '../../lib/vulcan-lib';
import {useCurrentUser} from "../common/withUser";
import {gql, NetworkStatus, useQuery} from "@apollo/client";

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    
  }
});

export const AllReactedCommentsPage = ({classes}: {
  classes: ClassesType,
}) => {
  const defaultLimit = 50;
  const pageSize = 50
  const [limit, setLimit] = useState(defaultLimit);
  
  const {data, fetchMore, networkStatus} = useQuery(gql`
  query getCommentsWithReacts($limit: Int) {
    CommentsWithReacts(limit: $limit) {
      comments {
        ...CommentsListWithParentMetadata
      }
    }
  }
  ${fragmentTextForQuery("CommentsListWithParentMetadata")}
  `,
    {
      ssr: true,
      fetchPolicy: "cache-and-network",
      nextFetchPolicy: "cache-only",
      variables: {limit: defaultLimit},
      notifyOnNetworkStatusChange: true
    }
  )
  
  const results = data && data.CommentsWithReacts.comments
  
  if (!data) return <Components.Loading/>
  
  return (
    <Components.SingleColumnSection>
      <Components.SectionTitle title="All Reacted Comments"/>
      <div className={classes.root}>
        {results.map((comment: CommentsListWithParentMetadata) =>
          <div key={comment._id}>
            <Components.CommentsNode
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
        <Components.LoadMore
          loading={networkStatus === NetworkStatus.fetchMore}
          loadMore={() => {
            const newLimit = limit + pageSize;
            void fetchMore({
              variables: {
                limit: newLimit
              },
              updateQuery: (prev, {fetchMoreResult}) => {
                if (!fetchMoreResult) return prev;
                return fetchMoreResult
              }
            })
            setLimit(newLimit);
          }}
          loadingClassName={classes.loadMoreSpinner}
        />
      </div>
    </Components.SingleColumnSection>
  )
} 
  
const AllReactedCommentsPageComponent = registerComponent('AllReactedCommentsPage', AllReactedCommentsPage, {styles});

declare global {
  interface ComponentTypes {
    AllReactedCommentsPage: typeof AllReactedCommentsPageComponent
  }
}
