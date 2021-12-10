import React from 'react';
import { useMulti } from '../../lib/crud/withMulti';
import { REVIEW_YEAR } from '../../lib/reviewUtils';
import { registerComponent } from '../../lib/vulcan-lib';


const styles = theme => ({
  root: {
    
  }
})

const ReviewAdminDashboard = ({classes}:{classes:ClassesType}) => {

  const { results: dbVotes, loading: dbVotesLoading } = useMulti({
    terms: {view: "reviewVotesAdminDashboard", limit: 600, year: REVIEW_YEAR+""},
    collectionName: "ReviewVotes",
    fragmentName: "reviewVoteWithUser",
    fetchPolicy: 'network-only',
  })

  return <div>

  </div>
}

const ReviewAdminDashboardComponent = registerComponent('ReviewAdminDashboard', ReviewAdminDashboard, {styles});

declare global {
  interface ComponentTypes {
    ReviewAdminDashboard: typeof ReviewAdminDashboardComponent
  }
}