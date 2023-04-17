import { registerComponent, Components } from '../../lib/vulcan-lib';
import React from 'react';
import withErrorBoundary from '../common/withErrorBoundary';
import {AnalyticsContext} from "../../lib/analyticsEvents";
import {useCurrentUser} from "../common/withUser"
import { gql, useQuery } from '@apollo/client';

const ReadHistoryPage = () => {
  const currentUser = useCurrentUser()
  const { data, loading } = useQuery(gql`
    query getReadHistory() {
      UserReadHistory() {}
    }
    `,
    {skip: !currentUser}
  )
  console.log(data)
  
  const {SingleColumnSection, SectionTitle, BookmarksList} = Components

  if (!currentUser) return <span>You must sign in to view your read history.</span>

  return <SingleColumnSection>
      <AnalyticsContext listContext={"ReadHistoryPage"} capturePostItemOnMount>
        <SectionTitle title="Read history"/>
        <BookmarksList/>
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
