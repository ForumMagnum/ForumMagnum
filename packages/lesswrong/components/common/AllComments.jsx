import { Components, registerComponent } from 'meteor/vulcan:core';
import React from 'react';
import withUser from '../common/withUser';

const AllComments = (props, context) => {
  const { SingleColumnSection, RecentComments, SectionTitle } = Components
  return (
    <SingleColumnSection>
      <SectionTitle title="All Comments"/>
      <RecentComments />
    </SingleColumnSection>
  )
};

registerComponent('AllComments', AllComments, withUser);
