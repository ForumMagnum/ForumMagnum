import React from 'react';
import { Components, registerComponent } from '../../../lib/vulcan-lib/components';
import { useCurrentUser } from '../../common/withUser';

export const PetrovDayPollInner = () => {
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

export const PetrovDayPoll = registerComponent('PetrovDayPoll', PetrovDayPollInner);

declare global {
  interface ComponentTypes {
    PetrovDayPoll: typeof PetrovDayPoll
  }
}
