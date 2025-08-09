"use client";

import { registerComponent } from '../../lib/vulcan-lib/components';
import React from 'react';
import LocalGroupsList from "./LocalGroupsList";
import SingleColumnSection from "../common/SingleColumnSection";
import SectionTitle from "../common/SectionTitle";

const AllGroupsPage = () => {
  return (
    <SingleColumnSection>
      <SectionTitle title="All Groups"/>
      <LocalGroupsList
        view="all"
        limit={1000}
        terms={{}}
      />
    </SingleColumnSection>
  )
}

export default registerComponent('AllGroupsPage', AllGroupsPage);



