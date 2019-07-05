import React from 'react';
import { Components, registerComponent } from 'meteor/vulcan:core';

const ShortformPage = () => {
  const { SingleColumnSection, RecentComments, SectionTitle } = Components
  const terms = {view: 'shortform', limit: 100};
  
  return (
    <SingleColumnSection>
      <SectionTitle title="Shortform Posts"/>
      <RecentComments terms={terms} />
    </SingleColumnSection>
  )
}

registerComponent('ShortformPage', ShortformPage);