import React from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import { useCurrentUser } from '../common/withUser';
import { TagRels } from '../../lib/collections/tagRels/collection';
import { useVote } from '../votes/withVote';
import classNames from 'classnames';

const styles = theme => ({
  root: {
    width: 30,
    position: "absolute",
    textAlign: "center",
    top: "50%",
    marginTop: -10,
  },
  voteButton: {
    fontSize: 25,
  },
  vertLayoutVoteUp: {
    position: "absolute",
    left: 8,
    top: -16,
  },
  vertLayoutVoteDown: {
    position: "absolute",
    left: 8,
    top: 10,
  },
  score: {
    width: "100%",
    fontSize: ".95rem"
  },
});

const PostsItemTagRelevance = ({tagRel, post, classes}: {
  tagRel: TagRelFragment,
  post: PostsBase,
  classes: ClassesType,
}) => {
  const { VoteButton } = Components;
  const currentUser = useCurrentUser();
  const vote = useVote();
  
  return <Components.PostsItem2MetaInfo className={classes.root}>
    <div className={classNames(classes.voteButton, classes.vertLayoutVoteDown)}>
      <VoteButton
        orientation="down"
        color="error"
        voteType="Downvote"
        document={tagRel}
        currentUser={currentUser}
        collection={TagRels}
        vote={vote}
        solidArrow
      />
    </div>
    
    <div className={classes.score}>
      {tagRel.baseScore}
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
        solidArrow
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
