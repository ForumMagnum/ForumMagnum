import { Components, registerComponent } from 'meteor/vulcan:core';
import React from 'react';
import { useLocation } from '../../lib/routeUtil';

const AllComments = () => {
  const { query } = useLocation();
  const { SingleColumnSection, RecentComments, SectionTitle } = Components
  const terms = _.isEmpty(query) ? {view: 'recentComments', limit: 100} : query;
  
  return (
    <SingleColumnSection>
      <SectionTitle title="All Comments"/>
      <RecentComments terms={terms} />
    </SingleColumnSection>
  )
};

registerComponent('AllComments', AllComments);
