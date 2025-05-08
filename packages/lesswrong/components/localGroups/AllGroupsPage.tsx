import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import React from 'react';

const AllGroupsPageInner = () => {
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

export const AllGroupsPage = registerComponent('AllGroupsPage', AllGroupsPageInner);

declare global {
  interface ComponentTypes {
    AllGroupsPage: typeof AllGroupsPage
  }
}

