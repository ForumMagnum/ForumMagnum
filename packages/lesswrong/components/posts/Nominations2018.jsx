import React from 'react';
import { Components, registerComponent } from 'meteor/vulcan:core';

const Nominations2018 = () => {

  const { SingleColumnSection, SectionTitle,  PostsList2 } = Components

  return (
      <SingleColumnSection>
        <SectionTitle title="Nominations for the 2018 Review"/>
        <PostsList2 terms={{view:"nominations2018"}}/>
      </SingleColumnSection>
  )
}

registerComponent('Nominations2018', Nominations2018);
