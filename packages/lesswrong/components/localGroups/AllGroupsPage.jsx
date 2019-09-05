import { Components, registerComponent } from 'meteor/vulcan:core';
import React from 'react';

const AllGroupsPage = ({ timezone, classes }) => {
  const { SingleColumnSection, SectionTitle } = Components

  return (
    <SingleColumnSection>
      <SectionTitle title="All Local Groups"/>
      <Components.LocalGroupsList
        terms={{view: "all", limit: 1000}}
        showHeader={false} />
    </SingleColumnSection>
  )
}

registerComponent('AllGroupsPage', AllGroupsPage);
