import { Components, registerComponent } from '../../lib/vulcan-lib';
import React from 'react';
import { useLocation } from '../../lib/routeUtil';
import * as _ from 'underscore';

const AllComments = () => {
  const { query } = useLocation();
  const { SingleColumnSection, RecentComments, SectionTitle } = Components
  const terms: CommentsViewTerms = _.isEmpty(query) ? {view: 'recentComments', limit: 100} : query;
  
  return (
    <SingleColumnSection>
      <SectionTitle title="All Comments"/>
      <RecentComments terms={terms} />
    </SingleColumnSection>
  )
};

const AllCommentsComponent = registerComponent('AllComments', AllComments);

declare global {
  interface ComponentTypes {
    AllComments: typeof AllCommentsComponent,
  }
}
