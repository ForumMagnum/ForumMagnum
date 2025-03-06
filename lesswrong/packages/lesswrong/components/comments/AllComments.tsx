import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import React from 'react';
import { useLocation } from '../../lib/routeUtil';
import * as _ from 'underscore';
import SingleColumnSection from "@/components/common/SingleColumnSection";
import RecentComments from "@/components/comments/RecentComments";
import { SectionTitle } from "@/components/common/SectionTitle";

const AllComments = () => {
  const { query } = useLocation();
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

export default AllCommentsComponent;
