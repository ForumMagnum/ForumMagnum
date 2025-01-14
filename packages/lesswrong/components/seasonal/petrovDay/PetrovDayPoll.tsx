import React from 'react';
import { registerComponent, Components } from '../../../lib/vulcan-lib';
import { useCurrentUser } from '../../common/withUser';

export const PetrovDayPoll = () => {
  const { SingleColumnSection, Error404, ContentStyles } = Components
  const currentUser = useCurrentUser()
  if (!currentUser) return <Error404/>
  return <SingleColumnSection>
    <ContentStyles contentType="comment">
      <h2>You choice has been made.</h2>
      <p>It cannot be unmade.</p>
    </ContentStyles>
  </SingleColumnSection>;
}

const PetrovDayPollComponent = registerComponent('PetrovDayPoll', PetrovDayPoll);

declare global {
  interface ComponentTypes {
    PetrovDayPoll: typeof PetrovDayPollComponent
  }
}
