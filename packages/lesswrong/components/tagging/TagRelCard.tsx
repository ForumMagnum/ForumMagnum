import React from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import { useVote } from '../votes/withVote';
import { useCurrentUser } from '../common/withUser';
import { TagRels } from '../../lib/collections/tagRels/collection';

const styles = theme => ({
  relevance: {
    marginTop: 12,
    marginLeft: 16,
    ...theme.typography.commentStyle,
  },
  relevanceLabel: {
    marginRight: 8,
    color: theme.palette.grey[600]
  },
  voteButton: {
    display: "inline-block",
    fontSize: 25,
  },
  score: {
    marginLeft: 4,
    marginRight: 4,
  }
});

const TagRelCard = ({tagRel, classes, relevance=true}: {
  tagRel: TagRelMinimumFragment,
  classes: ClassesType,
  relevance?: boolean
}) => {
  const currentUser = useCurrentUser();
  const vote = useVote("TagRels");
  const { VoteButton, TagPreview } = Components;
  
  return <div>
    <div className={classes.relevance}>
      <span className={classes.relevanceLabel}>
        Relevance
      </span>
      
      <div className={classes.voteButton}>
        <VoteButton
          orientation="left"
          color="error"
          voteType="Downvote"
          document={tagRel}
          collection={TagRels}
          vote={vote}
        />
      </div>
      <span className={classes.score}>
        {tagRel.baseScore}
      </span>
      <div className={classes.voteButton}>
        <VoteButton
          orientation="right"
          color="secondary"
          voteType="Upvote"
          document={tagRel}
          collection={TagRels}
          vote={vote}
        />
      </div>
    </div>
    <TagPreview tag={tagRel.tag}/>
  </div>
}

const TagRelCardComponent = registerComponent("TagRelCard", TagRelCard, {styles});

declare global {
  interface ComponentTypes {
    TagRelCard: typeof TagRelCardComponent
  }
}

