import { registerComponent, Components, fragmentTextForQuery } from '../../lib/vulcan-lib';
import React from 'react';
import withErrorBoundary from '../common/withErrorBoundary';
import {AnalyticsContext} from "../../lib/analyticsEvents";
import {useCurrentUser} from "../common/withUser"
import { gql, useQuery } from '@apollo/client';

const ReadHistoryPage = () => {
  const currentUser = useCurrentUser()
  const { data, loading } = useQuery(gql`
    query getReadHistory {
      UserReadHistory {
        ...PostsList
      }
    }
    ${fragmentTextForQuery("PostsList")}
    `,
    {ssr: true, skip: !currentUser}
  )
  console.log(data)
  
  const {SingleColumnSection, SectionTitle, Loading, PostsItem} = Components

  if (!currentUser) return <span>You must sign in to view your read history.</span>
  
  const posts = data?.UserReadHistory

  return <SingleColumnSection>
      <AnalyticsContext listContext={"ReadHistoryPage"} capturePostItemOnMount>
        <SectionTitle title="Read history"/>
        {loading || !posts ? <Loading /> : posts.map(post => <PostsItem
          key={post._id} post={post}
        />)}
      </AnalyticsContext>
    </SingleColumnSection>
}


const ReadHistoryPageComponent = registerComponent('ReadHistoryPage', ReadHistoryPage, {
  hocs: [withErrorBoundary]
});

declare global {
  interface ComponentTypes {
    ReadHistoryPage: typeof ReadHistoryPageComponent
  }
}
