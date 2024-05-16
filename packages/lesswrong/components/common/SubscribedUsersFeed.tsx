import React from 'react';
import { Components, registerComponent } from "../../lib/vulcan-lib/components";

const styles = (theme: ThemeType) => ({
})

const SubscribedUsersFeed = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {
  const { MixedTypeFeed, SuggestedFeedSubscriptions } = Components;
  
  return <div>
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
            return <Components.RecentDiscussionThread
              key={postCommented.post._id}
              post={postCommented.post}
              comments={postCommented.comments}
              refetch={()=>{} /*TODO*/}
              smallerFonts={true}
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

