import React from 'react';
import { Components, registerComponent } from 'meteor/vulcan:core';

// TODO;(EA Forum) Confirm that we get the styles back a la
// https://github.com/LessWrong2/Lesswrong2/blame/master/packages/lesswrong/components/shortform/ShortformPage.jsx

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
