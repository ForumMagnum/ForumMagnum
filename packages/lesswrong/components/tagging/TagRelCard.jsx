import React from 'react';
import { registerComponent, Components } from 'meteor/vulcan:core';
import { withStyles } from '@material-ui/core/styles';
import { withVote } from '../votes/withVote';
import { useCurrentUser } from '../common/withUser';
import { TagRels } from '../../lib/collections/tagRels/collection.js';

const styles = theme => ({
  tagName: {
  },
  relevanceLabel: {
  },
  score: {
  },
});

const TagRelCard = ({tagRel, vote, classes}) => {
  const currentUser = useCurrentUser();
  const { VoteButton } = Components;
  
  return <div>
    <div className={classes.tagName}>{tagRel.tag.name}</div>
    
    <span className={classes.relevanceLabel}>
      Relevance
    </span>
    <VoteButton
      orientation="left"
      color="error"
      voteType="Downvote"
      document={tagRel}
      currentUser={currentUser}
      collection={TagRels}
      vote={vote}
    />
    <span className={classes.score}>
      {tagRel.baseScore}
    </span>
    <Components.VoteButton
      orientation="right"
      color="secondary"
      voteType="Upvote"
      document={tagRel}
      currentUser={currentUser}
      collection={TagRels}
      vote={vote}
    />
  </div>
}

registerComponent("TagRelCard", TagRelCard,
  withVote,
  withStyles(styles, {name: "TagRelCard"}));
