import React from 'react';
import { Components, registerComponent } from "../../lib/vulcan-lib/components";

const styles = (theme: ThemeType) => ({
  root: {
    maxWidth: 700,
  }
})

const SubscribedUsersFeed = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {
  const { MixedTypeFeed, SuggestedFeedSubscriptions } = Components;
  
  return <div className={classes.root}>
    <SuggestedFeedSubscriptions />
    <MixedTypeFeed
      resolverName={"SubscribedFeed"}
      firstPageSize={10}
      pageSize={20}
      sortKeyType="Date"
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

