import React from 'react';
import { registerComponent, Components } from 'meteor/vulcan:core';
import { createStyles } from '@material-ui/core/styles';
import { useCurrentUser } from '../common/withUser';
import { TagRels } from '../../lib/collections/tagRels/collection';
import { useVote } from '../votes/withVote';
import classNames from 'classnames';

const styles = createStyles(theme => ({
  root: {
    width: 50,
    position: "absolute",
    textAlign: "center",
    top: "50%",
    marginTop: -10,
    
    [theme.breakpoints.down('sm')]: {
      width: 30,
    },
  },
  voteButton: {
    fontSize: 25,
  },
  horizLayoutVoteUp: {
    position: "absolute",
    left: 34,
    top: -3,
    
    display: "none",
    [theme.breakpoints.up('md')]: {
      display: "block",
    },
  },
  horizLayoutVoteDown: {
    position: "absolute",
    left: 4,
    top: -3,
    
    display: "none",
    [theme.breakpoints.up('md')]: {
      display: "block",
    },
  },
  vertLayoutVoteUp: {
    position: "absolute",
    left: 8,
    top: -18,
    
    display: "none",
    [theme.breakpoints.down('sm')]: {
      display: "block",
    },
  },
  vertLayoutVoteDown: {
    position: "absolute",
    left: 8,
    top: 12,
    
    display: "none",
    [theme.breakpoints.down('sm')]: {
      display: "block",
    },
  },
  score: {
    width: "100%",
  },
}));

const PostsItemTagRelevance = ({tagRel, post, classes}) => {
  const { VoteButton } = Components;
  const currentUser = useCurrentUser();
  const vote = useVote();
  
  return <Components.PostsItem2MetaInfo className={classes.root}>
    <div className={classNames(classes.voteButton, classes.horizLayoutVoteDown)}>
      <VoteButton
        orientation="left"
        color="error"
        voteType="Downvote"
        document={tagRel}
        currentUser={currentUser}
        collection={TagRels}
        vote={vote}
      />
    </div>
    <div className={classNames(classes.voteButton, classes.vertLayoutVoteDown)}>
      <VoteButton
        orientation="down"
        color="error"
        voteType="Downvote"
        document={tagRel}
        currentUser={currentUser}
        collection={TagRels}
        vote={vote}
      />
    </div>
    
    <div className={classes.score}>
      {tagRel.baseScore}
    </div>
    
    <div className={classNames(classes.voteButton, classes.horizLayoutVoteUp)}>
      <VoteButton
        orientation="right"
        color="secondary"
        voteType="Upvote"
        document={tagRel}
        currentUser={currentUser}
        collection={TagRels}
        vote={vote}
      />
    </div>
    <div className={classNames(classes.voteButton, classes.vertLayoutVoteUp)}>
      <VoteButton
        orientation="up"
        color="secondary"
        voteType="Upvote"
        document={tagRel}
        currentUser={currentUser}
        collection={TagRels}
        vote={vote}
      />
    </div>
  </Components.PostsItem2MetaInfo>
}

const PostsItemTagRelevanceComponent = registerComponent("PostsItemTagRelevance", PostsItemTagRelevance, {styles});

declare global {
  interface ComponentTypes {
    PostsItemTagRelevance: typeof PostsItemTagRelevanceComponent
  }
}