import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { Votes } from '../../lib/collections/votes';
import { useMulti } from '../../lib/crud/withMulti';
import { useCurrentUser } from '../common/withUser';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableRow from '@material-ui/core/TableRow';
import { TagRels } from '../../lib/collections/tagRels/collection';
import { Posts } from '../../lib/collections/posts';
import { Link } from '../../lib/reactRouterWrapper';
import { useVote } from '../votes/withVote';

const styles = theme => ({
  voteRow: {
  },
  headerCell: {
    fontWeight: "bold"
  },
  votingCell: {
    textAlign: "center",
    fontSize: '1.4rem'
  },
  voteButtons: {
    width: 50
  },
  tagCell: {
    width: 200
  },
  score: {
    fontSize: '1.2rem',
    position: "relative",
    bottom: -1,
    margin: 5
  }
})

const TagVoteActivity = ({classes}:{
  classes: ClassesType,
}) => {
  const { SingleColumnSection, FormatDate, Error404, VoteButton, FooterTag, LoadMore } = Components
  const { results: votes, loadMoreProps } = useMulti({
    terms: {view:"tagVotes"},
    collection: Votes,
    fragmentName: 'TagRelVotes',
    limit: 200,
    ssr: true
  })
  const castVote = useVote()

  const currentUser = useCurrentUser();

  if (!currentUser?.isAdmin) { return <Error404/> }

  return <SingleColumnSection>
    <Table>
      <TableBody>
        <TableRow className={classes.headerRow}>
          <TableCell className={classes.headerCell}> User </TableCell>
          <TableCell className={classes.headerCell}> Tag </TableCell>
          <TableCell className={classes.headerCell}> Pow </TableCell>
          <TableCell className={classes.headerCell}> Post Title </TableCell>
          <TableCell className={classes.headerCell}> When </TableCell>
          <TableCell className={classes.headerCell}> Vote </TableCell>
        </TableRow>
        {votes?.map(vote=><TableRow key={vote._id} className={classes.voteRow}>
            <TableCell>{vote.userId?.slice(7,10)}</TableCell>
            <TableCell className={classes.tagCell}><FooterTag tag={vote.tagRel?.tag} tagRel={vote.tagRel} /></TableCell>
            <TableCell>{vote.power} {vote.isUnvote && <span title="Unvote">(unv.)</span>}</TableCell>
            <TableCell> <Link to={Posts.getPageUrl(vote.tagRel?.post)}> {vote.tagRel?.post?.title} </Link> </TableCell>
            <TableCell><FormatDate date={vote.votedAt}/></TableCell>
            <TableCell className={classes.votingCell}>
              <div className={classes.voteButtons}>
                <VoteButton
                  orientation="left"
                  color="error"
                  voteType="Downvote"
                  document={vote.tagRel}
                  currentUser={currentUser}
                  collection={TagRels}
                  vote={castVote}
                />
                <span className={classes.score}>
                  {vote.tagRel?.baseScore}
                </span>
                <VoteButton
                  orientation="right"
                  color="secondary"
                  voteType="Upvote"
                  document={vote.tagRel}
                  currentUser={currentUser}
                  collection={TagRels}
                  vote={castVote}
                />
              </div>
            </TableCell>
          </TableRow>)}
      </TableBody>
    </Table>
    <LoadMore {...loadMoreProps} />
  </SingleColumnSection>
}


const TagVoteActivityComponent = registerComponent("TagVoteActivity", TagVoteActivity, {styles});

declare global {
  interface ComponentTypes {
    TagVoteActivity: typeof TagVoteActivityComponent
  }
}

