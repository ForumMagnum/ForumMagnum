import { Components, fragmentTextForQuery, registerComponent } from '../../lib/vulcan-lib';
import React from 'react';
import { AnalyticsContext } from "../../lib/analyticsEvents";
import { getReviewPhase, reviewIsActive, REVIEW_YEAR } from '../../lib/reviewUtils';
import {gql, NetworkStatus, useQuery} from "@apollo/client";



const LWHome = () => {
  const { RecentDiscussionFeed, HomeLatestPosts, AnalyticsInViewTracker, LWRecommendations, FrontpageReviewWidget, SingleColumnSection, FrontpageBestOfLWWidget } = Components

  // const { data, fetchMore, networkStatus, loading } = useQuery(gql`
  // query getCommentsWithReacts($limit: Int) {
  //   CommentsWithReacts(limit: $limit) {
  //     comments {
  //       ...CommentsListWithParentMetadata
  //     }
  //   }
  // }
  // ${fragmentTextForQuery("CommentsListWithParentMetadata")}
  // `,
  //   {
  //     ssr: true,
  //     fetchPolicy: "cache-and-network",
  //     nextFetchPolicy: "cache-only",
  //     variables: {limit: 50},
  //     notifyOnNetworkStatusChange: true
  //   }
  // )

  // const results = data?.CommentsWithReacts.comments
  // console.log("results yeaaaahhhh", results)

  const { data, fetchMore, networkStatus, loading } = useQuery(gql`
  query get10000karmaUsers {
    SuggestedDialogueUsers(limit: 100) {
      users {
        ...UsersMinimumInfo
      }
    }
  }
  ${fragmentTextForQuery('UsersMinimumInfo')}
  `,
    {
      ssr: true,
      fetchPolicy: "cache-and-network",
      nextFetchPolicy: "cache-only",
      variables: {limit: 50},
      notifyOnNetworkStatusChange: true
    }
  )

  const results = data?.SuggestedDialogueUsers?.users
  console.log("hereeeeee", {results: results?.slice(0, 10), data})
  


  return (
      <AnalyticsContext pageContext="homePage">
        <React.Fragment>

          {!reviewIsActive() && <LWRecommendations configName="frontpage" />}

          {<div>
            <h2>Users with over 10000 karma</h2>
              <ul>
                {results?.slice(0, 10).map(user => (
                  <li key={user._id}>{user.displayName}</li>
                ))}
              </ul>
            </div>}
        
          {reviewIsActive() && getReviewPhase() !== "RESULTS" && <SingleColumnSection>
            <FrontpageReviewWidget reviewYear={REVIEW_YEAR}/>
          </SingleColumnSection>}
          
          <AnalyticsInViewTracker
              eventProps={{inViewType: "latestPosts"}}
              observerProps={{threshold:[0, 0.5, 1]}}
          >
            <HomeLatestPosts />
          </AnalyticsInViewTracker>

          <RecentDiscussionFeed
            af={false}
            commentsLimit={4}
            maxAgeHours={18}
          />
        </React.Fragment>
      </AnalyticsContext>
  )
}

const LWHomeComponent = registerComponent('LWHome', LWHome);

declare global {
  interface ComponentTypes {
    LWHome: typeof LWHomeComponent
  }
}
