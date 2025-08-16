"use client";

import React from 'react';
import { registerComponent } from '../../../lib/vulcan-lib/components';
import { useCurrentUser } from '../../common/withUser';
import SingleColumnSection from "../../common/SingleColumnSection";
import Error404 from "../../common/Error404";
import ContentStyles from "../../common/ContentStyles";

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

export default registerComponent('PetrovDayPoll', PetrovDayPoll);


