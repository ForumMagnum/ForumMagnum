import React, { useCallback, useRef } from 'react';
import { Components, registerComponent } from "../../lib/vulcan-lib/components";
import { ObservableQuery } from '@apollo/client';

const styles = (theme: ThemeType) => ({
  root: {
  }
})

const SubscribedUsersFeed = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {
  const { MixedTypeFeed, SuggestedFeedSubscriptions } = Components;
  
  const refetchRef = useRef<null | ObservableQuery['refetch']>(null);
  const refetch = useCallback(() => {
    if (refetchRef.current) {
      void refetchRef.current();
    }
  }, [refetchRef]);
  
  return <div className={classes.root}>
    <SuggestedFeedSubscriptions refetchFeed={refetch} />
    <MixedTypeFeed
      resolverName={"SubscribedFeed"}
      refetchRef={refetchRef}
      firstPageSize={10}
      pageSize={20}
      sortKeyType="Date"
      nextFetchPolicy={'cache-and-network'}
      reorderOnRefetch
      renderers={{
        postCommented: {
          fragmentName: "SubscribedPostAndCommentsFeed",
          render: (postCommented: SubscribedPostAndCommentsFeed) => {
            return <Components.FeedPostCommentsCard
              key={postCommented.post._id}
              post={postCommented.post}
              comments={postCommented.comments}
              maxCollapsedLengthWords={postCommented.postIsFromSubscribedUser ? 200 : 50}
              refetch={()=>{} /*TODO*/}
            />
          },
        }
      }}
    />
  </div>
}

const SubscribedUsersFeedComponent = registerComponent('SubscribedUsersFeed', SubscribedUsersFeed, {styles});

declare global {
  interface ComponentTypes {
    SubscribedUsersFeed: typeof SubscribedUsersFeedComponent
  }
}

