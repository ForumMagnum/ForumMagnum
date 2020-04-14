import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { Votes } from '../../lib/collections/votes';
import { useMulti } from '../../lib/crud/withMulti';

const styles = theme => ({
  voteRow: {
    display: "flex",
    justifyContent: "space-between",
    ...theme.typography.commentStyle,
    width: "100%"
  }
})

const TagVoteActivity = ({classes}:{
  classes: ClassesType,
}) => {
  const { SingleColumnSection, FormatDate } = Components
  const { results: votes } = useMulti({
    terms: {view:"tagVotes"},
    collection: Votes,
    fragmentName: 'TagRelVotes',
    limit: 50,
    ssr: true
  })

  return <SingleColumnSection>

      {votes?.map(vote=><div className={classes.voteRow}>
        <span>{vote.userId.slice(7,10)}</span>
        <span>{vote.documentId}</span>
        <span>{vote.voteType}</span>
        <FormatDate date={vote.votedAt}/>
      </div>)}
    </SingleColumnSection>
}


const TagVoteActivityComponent = registerComponent("TagVoteActivity", TagVoteActivity, {styles});

declare global {
  interface ComponentTypes {
    TagVoteActivity: typeof TagVoteActivityComponent
  }
}

