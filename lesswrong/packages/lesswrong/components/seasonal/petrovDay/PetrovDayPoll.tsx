import React from 'react';
import { Components, registerComponent } from '../../../lib/vulcan-lib/components';
import { useCurrentUser } from '../../common/withUser';
import SingleColumnSection from "@/components/common/SingleColumnSection";
import Error404 from "@/components/common/Error404";
import { ContentStyles } from "@/components/common/ContentStyles";

export const PetrovDayPoll = () => {
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

export default PetrovDayPollComponent;
