import React from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import { useVote } from '../votes/withVote';
import { hasVotedClient } from '../../lib/voting/vote';

const styles = theme => ({
  relevance: {
    marginTop: 12,
    marginLeft: 16,
    marginRight: 16,
    ...theme.typography.commentStyle,
  },
  relevanceLabel: {
    color: theme.palette.grey[600]
  },
  score: {
    marginRight: 6,
  },
  removeButton: {
    float: "right"
  },
  removed: {
    float: "right",
    color: theme.palette.grey[400]
  }
});

const TagRelCard = ({tagRel, classes}: {
  tagRel: TagRelMinimumFragment,
  classes: ClassesType,
}) => {
  const voteProps = useVote(tagRel, "TagRels");
  const newlyVoted = !!(hasVotedClient({userVotes: voteProps.document.currentUserVotes, voteType: "smallUpvote"}) && voteProps.voteCount === 1)

  const { TagPreview, TagRelevanceButton, LWTooltip } = Components;
  
  return <div>
    <div className={classes.relevance}>
      <LWTooltip title={<div>Relevance determines how highly this post is sorted on the <em>{tagRel.tag.name}</em> tag page. <div><em>(You can vote on relevance on the tag page.)</em></div></div>} placement="top">
        <span className={classes.relevanceLabel}>
          <span className={classes.score}>
            {voteProps.baseScore}
          </span>
          Relevance 
        </span>
      </LWTooltip>
      {newlyVoted && <span className={classes.removeButton}>
        <LWTooltip title={"Remove your relevance vote from this tag"} placement="top">
          <TagRelevanceButton label="Remove Tag" {...voteProps} voteType="smallUpvote" cancelVote/>
        </LWTooltip>
      </span>}
      {voteProps.baseScore <= 0 && <span className={classes.removed}>Removed (refresh page)</span>}
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

