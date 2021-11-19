import React from 'react';
import { useLocation } from '../../lib/routeUtil';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import { useCurrentUser } from '../common/withUser';

const UserSuggestNominations = () => {
    const { SectionTitle, SingleColumnSection, ErrorBoundary, PostsByVoteWrapper } = Components
    const currentUser = useCurrentUser()

    const { params } = useLocation();
    const year = parseInt(params?.year);
    if (!currentUser) return null

    return <ErrorBoundary>
        <SingleColumnSection>
          <SectionTitle title={`Your Strong Upvotes from ${year}`}/>
          <PostsByVoteWrapper voteType="bigUpvote" year={year}/>
        </SingleColumnSection>
        <SingleColumnSection>
          <SectionTitle title={`Your Upvotes from ${year}`}/>
          <PostsByVoteWrapper voteType="smallUpvote" year={year}/>
        </SingleColumnSection>
      </ErrorBoundary>
}

const UserSuggestNominationsComponent = registerComponent("UserSuggestNominations", UserSuggestNominations);

declare global {
  interface ComponentTypes {
    UserSuggestNominations: typeof UserSuggestNominationsComponent
  }
}

