import { Components, registerComponent } from '../../lib/vulcan-lib';
import React from 'react';

const AllGroupsPage = () => {
  const { SingleColumnSection, SectionTitle } = Components

  return (
    <SingleColumnSection>
      <SectionTitle title="All Groups"/>
      <Components.LocalGroupsList
        terms={{view: "all", limit: 1000}}
      />
    </SingleColumnSection>
  )
}

const AllGroupsPageComponent = registerComponent('AllGroupsPage', AllGroupsPage);

declare global {
  interface ComponentTypes {
    AllGroupsPage: typeof AllGroupsPageComponent
  }
}

