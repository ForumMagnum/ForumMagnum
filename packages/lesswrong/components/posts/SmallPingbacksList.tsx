import React from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import { useMulti } from '../../lib/crud/withMulti';
import { useOnMountTracking } from "../../lib/analyticsEvents";

const styles = (theme: ThemeType): JssStyles => ({
  list: {
    display: "flex"
  }
});

const SmallPingbacksList = ({postId}: {
  classes: ClassesType,
  postId: string,
}) => {
  const { results, loading } = useMulti({
    terms: {
      view: "pingbackPosts",
      postId: postId,
    },
    collectionName: "Posts",
    fragmentName: "PostsList",
    limit: 10
  });

  const pingbackIds = (results||[]).map((pingback) => pingback._id)
  useOnMountTracking({eventType: "pingbacksList", eventProps: {pingbackIds}, captureOnMount: eventProps => eventProps.pingbackIds.length, skip: !pingbackIds.length||loading})

  const { PostKarmaWithPreview, Loading } = Components

  return <div>
    {loading && <Loading/> }
    {results?.map((post, i) => <PostKarmaWithPreview key={post._id} post={post}/>)}
  </div>
}

const SmallPingbacksListComponent = registerComponent("SmallPingbacksList", SmallPingbacksList, {styles});

declare global {
  interface ComponentTypes {
    SmallPingbacksList: typeof SmallPingbacksListComponent
  }
}

