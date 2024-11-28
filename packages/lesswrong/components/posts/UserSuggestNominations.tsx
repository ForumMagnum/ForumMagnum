import React from 'react';
import { useLocation } from '../../lib/routeUtil';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import { useCurrentUser } from '../common/withUser';

const UserSuggestNominations = () => {
    const { SectionTitle, SingleColumnSection, ErrorBoundary, PostsByVoteWrapper , ReadHistoryTab, PostsListUserCommentedOn} = Components
    const currentUser = useCurrentUser()

    const { params } = useLocation();
    
    // Handle url-encoded special case, otherwise parseInt year
  const before2020 = '≤2020'
  const year = [before2020, '%e2%89%a42020'].includes(params?.year) ?
      before2020 :
      parseInt(params?.year)
    if (!currentUser) return null
  
    const startDate = year === before2020? undefined : new Date(year, 0, 1)
    const endDate = year === before2020? new Date(2020, 0, 1): new Date(year + 1, 0, 1)

    return <ErrorBoundary>
      <SingleColumnSection>
        <SectionTitle title={`Your Strong Upvotes for posts from ${year}`}/>
        <PostsByVoteWrapper voteType="bigUpvote" year={year}/>
      </SingleColumnSection>
      <SingleColumnSection>
        <SectionTitle title={`Your Upvotes for posts from ${year}`}/>
        <PostsByVoteWrapper voteType="smallUpvote" year={year}/>
      </SingleColumnSection>
      <SingleColumnSection>
        <SectionTitle title={`Posts from ${year} you've commented on`}/>
        <PostsListUserCommentedOn filter={{startDate, endDate, showEvents: false}} sort={{karma: true}} />
      </SingleColumnSection>  
      <SingleColumnSection>
        <SectionTitle title={`Posts from ${year} you've read`}/>
        <ReadHistoryTab groupByDate={false} filter={{startDate, endDate, showEvents: false}} sort={{karma: true}} />
      </SingleColumnSection>
    </ErrorBoundary>
}

const UserSuggestNominationsComponent = registerComponent("UserSuggestNominations", UserSuggestNominations);

declare global {
  interface ComponentTypes {
    UserSuggestNominations: typeof UserSuggestNominationsComponent
  }
}
