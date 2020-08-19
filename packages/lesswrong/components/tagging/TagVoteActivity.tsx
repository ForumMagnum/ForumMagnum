import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { Votes } from '../../lib/collections/votes';
import { useMulti } from '../../lib/crud/withMulti';
import { useVote } from '../votes/withVote';

const styles = (theme: ThemeType): JssStyles => ({
  voteRow: {
    ...theme.typography.body2,
    ...theme.typography.commentStyle,
    ...theme.typography.smallText,
    color: theme.palette.grey[600]
  },
  headerCell: {
    fontWeight: 700,
    ...theme.typography.body2,
    ...theme.typography.commentStyle,
  },
  votingCell: {
    textAlign: "center",
    fontSize: '1.4rem'
  },
  voteButtons: {
    width: 50
  },
  postCell: {
    maxWidth: 316,
    paddingRight: 16
  },
  tagCell: {
    maxWidth: 216,
    paddingRight: 16
  },
  score: {
    fontSize: '1.2rem',
    position: "relative",
    bottom: -1,
    margin: 5
  },
  smallCell: {
    textAlign: "center"
  }
})

const TagVoteActivityRow = ({vote, classes}: {
  vote: TagVotingActivity,
  classes: ClassesType
}) => {
  const { FormatDate, VoteButton, FooterTag, UsersName, TagSmallPostLink } = Components;
  const voteProps = useVote(vote.tagRel, "TagRels")
  return (
    <tr key={vote._id} className={classes.voteRow}>
      <td><UsersName documentId={vote.userId}/></td>
      <td className={classes.postCell}> <TagSmallPostLink hideMeta post={vote.tagRel?.post}/> </td>
      <td className={classes.tagCell}>
        <FooterTag tag={vote.tagRel?.tag} tagRel={vote.tagRel} hideScore smallText/>
      </td>
      <td className={classes.smallCell}>{vote.power} {vote.isUnvote && <span title="Unvote">(unv.)</span>}</td>
      <td className={classes.smallCell}><FormatDate date={vote.votedAt}/></td>
      <td className={classes.votingCell}>
        <div className={classes.voteButtons}>
          <VoteButton
            orientation="left"
            color="error"
            voteType="Downvote"
            {...voteProps}
          />
          <span className={classes.score}>
            {voteProps.baseScore}
          </span>
          <VoteButton
            orientation="right"
            color="secondary"
            voteType="Upvote"
            {...voteProps}
          />
        </div>
      </td>
    </tr>
  );
}

const TagVoteActivity = ({classes}: {
  classes: ClassesType,
}) => {
  const { SingleColumnSection, LoadMore } = Components
  const { results: votes, loadMoreProps } = useMulti({
    terms: {view:"tagVotes"},
    collection: Votes,
    fragmentName: 'TagVotingActivity',
    limit: 200,
    ssr: true,
    itemsPerPage: 200,
  })

  return <SingleColumnSection>
    <table>
      <tbody>
        <tr className={classes.headerRow}>
          <td className={classes.headerCell}> User </td>
          <td className={classes.headerCell}> Post Title </td>
          <td className={classes.headerCell}> Tag </td>
          <td className={classes.headerCell}> Pow </td>
          <td className={classes.headerCell}> When </td>
          <td className={classes.headerCell}> Vote </td>
        </tr>
        {votes?.map(vote => <TagVoteActivityRow key={vote._id} vote={vote} classes={classes}/>)}
      </tbody>
    </table>
    <LoadMore {...loadMoreProps} />
  </SingleColumnSection>
}


const TagVoteActivityComponent = registerComponent("TagVoteActivity", TagVoteActivity, {styles});

declare global {
  interface ComponentTypes {
    TagVoteActivity: typeof TagVoteActivityComponent
  }
}

