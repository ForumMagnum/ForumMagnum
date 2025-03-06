import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import React from 'react';
import SingleColumnSection from "@/components/common/SingleColumnSection";
import { SectionTitle } from "@/components/common/SectionTitle";
import LocalGroupsList from "@/components/localGroups/LocalGroupsList";

const AllGroupsPage = () => {
  return (
    <SingleColumnSection>
      <SectionTitle title="All Groups"/>
      <LocalGroupsList
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

export default AllGroupsPageComponent;

