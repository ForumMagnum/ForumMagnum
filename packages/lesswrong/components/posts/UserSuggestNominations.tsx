import React from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import { useCurrentUser } from '../common/withUser';

export const REVIEW_YEAR = 2020

const UserSuggestNominations = () => {
    const { SectionTitle, SingleColumnSection, ErrorBoundary, PostsByVoteWrapper } = Components
    const currentUser = useCurrentUser()

    if (!currentUser) return null

    return <ErrorBoundary>
        <SingleColumnSection>
          <SectionTitle title={`Your Strong Upvotes from ${REVIEW_YEAR}`}/>
          <PostsByVoteWrapper voteType="bigUpvote" currentUser={currentUser}/>
        </SingleColumnSection>
        <SingleColumnSection>
          <SectionTitle title={`Your Upvotes from ${REVIEW_YEAR}`}/>
          <PostsByVoteWrapper voteType="smallUpvote" currentUser={currentUser}/>
        </SingleColumnSection>
      </ErrorBoundary>
}

const UserSuggestNominationsComponent = registerComponent("UserSuggestNominations", UserSuggestNominations);

declare global {
  interface ComponentTypes {
    UserSuggestNominations: typeof UserSuggestNominationsComponent
  }
}

