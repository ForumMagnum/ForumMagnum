import React from 'react';
import { Components, registerComponent } from 'vulcan:core';

const ShortformPage = () => {
  const { SingleColumnSection, ShortformThreadList, SectionTitle } = Components

  return (
    <SingleColumnSection>
      <SectionTitle title="Shortform Content [Beta]"/>
      <ShortformThreadList terms={{view: 'shortform', limit:20, testLimit:30}} />
    </SingleColumnSection>
  )
}

registerComponent('ShortformPage', ShortformPage);