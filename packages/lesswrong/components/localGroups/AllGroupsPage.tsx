import { registerComponent } from '../../lib/vulcan-lib/components';
import React from 'react';
import { LocalGroupsList } from "./LocalGroupsList";
import { SingleColumnSection } from "../common/SingleColumnSection";
import { SectionTitle } from "../common/SectionTitle";

const AllGroupsPageInner = () => {
  return (
    <SingleColumnSection>
      <SectionTitle title="All Groups"/>
      <LocalGroupsList
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

