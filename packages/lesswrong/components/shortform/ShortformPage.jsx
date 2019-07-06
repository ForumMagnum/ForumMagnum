import React from 'react';
import { Components, registerComponent } from 'meteor/vulcan:core';

const ShortformPage = () => {
  const { SingleColumnSection, ShortformThreadList, SectionTitle } = Components
  
  return (
    <SingleColumnSection>
      <SectionTitle title="Shortform Content"/>
      <ShortformThreadList terms={{view: 'shortform', limit:20}} />
    </SingleColumnSection>
  )
}

registerComponent('ShortformPage', ShortformPage);