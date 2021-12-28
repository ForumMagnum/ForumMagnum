import React from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableRow from '@material-ui/core/TableRow';
import { REVIEW_YEAR } from '../../lib/reviewUtils';
import { useMulti } from '../../lib/crud/withMulti';
import { forumTypeSetting } from '../../lib/instanceSettings';
import { headerStyle } from '../posts/SpreadsheetPage';
import { useCurrentUser } from '../common/withUser';

const isEAForum = forumTypeSetting.get() === 'EAForum'

const cellStyle = () => ({
  maxWidth: 350,
  wordBreak: "break-word",
  verticalAlign: "top"
})

export const reviewCells = theme => ({
  titleCell: {
    ...cellStyle()
  },
  reviewsCell: {
    ...cellStyle()
  },
  pingBacksCell: {
    ...cellStyle(),
    maxWidth: 200,
  },
  voteCell: {
    ...cellStyle(),
    padding: 0,
    width: 140,
    '&:last-child': {
      padding: 0
    },
    verticalAlign: "center",
    backgroundColor: "rgba(0,0,0,.05)"
  },
  header: {
    ...headerStyle(theme),
    ...cellStyle(),
    verticalAlign: "center"
  }
})

const styles = theme => ({
  root: {
    
  },
  ...reviewCells(theme)
})

const ReviewFullDashboard = ({classes}) => {

  const reviewYear = REVIEW_YEAR
  
  const { Loading, ReviewFullDashboardRow } = Components

  const currentUser = useCurrentUser()

  const { results, loading } = useMulti({
    terms: {
      view: "reviewVoting",
      before: `${REVIEW_YEAR+1}-01-01`,
      ...(isEAForum ? {} : {after: `${reviewYear}-01-01`}),
      limit: 600,
      excludeContents: true,
    },
    collectionName: "Posts",
    fragmentName: 'PostsListWithVotes',
    fetchPolicy: 'cache-and-network',
  });
  // useMulti is incorrectly typed
  const postsResults = results as PostsListWithVotes[] | null;

  return <div>
    { loading && <Loading/>}
    <Table>
      <TableBody>
        <TableRow key={`row-0`}>
          <TableCell classes={{root: classes.header}}>
            Post Title
          </TableCell>
          <TableCell classes={{root: classes.header}}>
            Pingbacks
          </TableCell>
          <TableCell classes={{root: classes.header}}>
            Reviews
          </TableCell>
          <TableCell classes={{root: classes.header}}>
            Voting
          </TableCell>
        </TableRow>
        { postsResults?.map((post) => <ReviewFullDashboardRow key={post.
        _id} post={post} reviewYear={reviewYear}/>)}
      </TableBody>
    </Table>
  </div>
}

const ReviewFullDashboardComponent = registerComponent('ReviewFullDashboard', ReviewFullDashboard, {styles});

declare global {
  interface ComponentTypes {
    ReviewFullDashboard: typeof ReviewFullDashboardComponent
  }
}
