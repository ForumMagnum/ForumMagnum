import { useMutation } from '@apollo/client';
import gql from 'graphql-tag';
import React from 'react';
import { useMulti } from '../../lib/crud/withMulti';
import { useSingle } from '../../lib/crud/withSingle';
import { Link } from '../../lib/reactRouterWrapper';
import { Components, registerComponent } from "../../lib/vulcan-lib";
import { useCurrentUser } from '../common/withUser';

const styles = (theme: ThemeType): JssStyles => ({
})

export const maxPostsToSyncAtOnce = 3;

const ReviewRssCrosspostsPage = ({classes}: {
  classes: ClassesType,
}) => {
  const { SingleColumnSection } = Components;
  const currentUser = useCurrentUser();

  const { results: pendingCrossposts, loading: loadingPosts, error: postsError } = useMulti({
    collectionName: "Posts",
    fragmentName: "PostsListWithVotes",
    terms: {
      view: "myPendingRssCrossposts",
      userId: currentUser?._id,
    },
    skip: !currentUser,
  });
  
  const { results: feeds, loading: loadingFeeds, error: feedsError } = useMulti({
    collectionName: "RSSFeeds",
    fragmentName: "RSSFeedMinimumInfo",
    terms: {
      view: "usersFeed",
      userId: currentUser?._id,
    },
    skip: !currentUser,
  });
  
  const [resyncFeedMutation] = useMutation(gql`
    mutation resyncRssFeed($feedId: String!) {
      resyncRssFeed(feedId: $feedId)
    }
  `);
  
  function resyncFeed(feed: RSSFeedMinimumInfo) {
    resyncFeedMutation({
      variables: {
        feedId: feed._id,
      },
    });
    // TODO: Refresh stuff after this
  }

  if (!currentUser) {
    return <Components.LoginForm/>
  }

  return <SingleColumnSection>
    {!feeds?.length && <>You haven{"'"}t set up any RSS feeds.</>}
    
    {feeds?.map((feed: RSSFeedMinimumInfo) => <div key={feed._id}>
      <h1>Pending Crossposts From {feed.nickname}</h1>
      <p>
        You have set up crossposting from {feed.url}.{" "}
        <a href="#" onClick={() => resyncFeed(feed)}>Recheck now</a>
      </p>
      
      <p>
        {feed.importAsDraft
          ? "New posts will be created as drafts."
          : "New posts will be posted immediately."
        }
      </p>
      
      <p>
        At most {maxPostsToSyncAtOnce} posts will be created at a time. If you are bulk-importing
        and want to crosspost imported posts, you will have to cross-post them manually.
      </p>
    
      {pendingCrossposts && pendingCrossposts
        .filter(post => post.feedId === feed._id)
        .map(post => (
          <Components.PostsItem key={post._id} post={post}/>
        ))}
    </div>)}
  </SingleColumnSection>
}

const ReviewRssCrosspostsPageComponent = registerComponent('ReviewRssCrosspostsPage', ReviewRssCrosspostsPage, {styles});

declare global {
  interface ComponentTypes {
    ReviewRssCrosspostsPage: typeof ReviewRssCrosspostsPageComponent
  }
}

