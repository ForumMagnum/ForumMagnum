import { Components, registerComponent } from 'meteor/vulcan:core';
import React from 'react';

const AllComments = ({location}) => {
  const { SingleColumnSection, RecentComments, SectionTitle } = Components
  const terms = _.isEmpty(location && location.query) ? {view: 'recentComments', limit: 100}: location.query;
  
  return (
    <SingleColumnSection>
      <SectionTitle title="All Comments"/>
      <RecentComments terms={terms} />
    </SingleColumnSection>
  )
};

registerComponent('AllComments', AllComments);
