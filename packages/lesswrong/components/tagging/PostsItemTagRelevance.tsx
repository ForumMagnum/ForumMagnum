import React from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import { useVote } from '../votes/withVote';
import classNames from 'classnames';
import Tooltip from '@material-ui/core/Tooltip';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    width: 30,
    position: "absolute",
    textAlign: "center",
    top: "51%",
    right: 'calc(100% - 2px)',
    marginTop: -10,
  },
  voteButton: {
    fontSize: 25,
  },
  vertLayoutVoteUp: {
    position: "absolute",
    left: 8,
    top: -15,
  },
  vertLayoutVoteDown: {
    position: "absolute",
    left: 8,
    top: 9,
  },
  score: {
    width: "100%",
    fontSize: 11
  },
});

const PostsItemTagRelevance = ({tagRel, classes}: {
  tagRel: WithVoteTagRel,
  post: PostsBase,
  classes: ClassesType,
}) => {
  const { VoteButton, PostsItem2MetaInfo } = Components;
  const voteProps = useVote(tagRel, "TagRels");
  
  const tooltip = <div>
    <div>{tagRel.baseScore} Relevance</div>
    <div>({tagRel.voteCount} {tagRel.voteCount === 1 ? "vote" : "votes"})</div>
  </div>

  return <PostsItem2MetaInfo className={classes.root}>
    <Tooltip title={tooltip} placement="left-end">
      <span>
        <div className={classNames(classes.voteButton, classes.vertLayoutVoteDown)}>
          <VoteButton
            orientation="down"
            color="error"
            voteType="Downvote"
            voteDimension="Overall"
            solidArrow
            {...voteProps}
          />
        </div>
        
        <div className={classes.score}>
          {voteProps.baseScore}
        </div>
      
        <div className={classNames(classes.voteButton, classes.vertLayoutVoteUp)}>
          <VoteButton
            orientation="up"
            color="secondary"
            voteType="Upvote"
            voteDimension="Overall"
            solidArrow
            {...voteProps}
          />
        </div>
      </span>
      </Tooltip>
    </PostsItem2MetaInfo>
}

const PostsItemTagRelevanceComponent = registerComponent("PostsItemTagRelevance", PostsItemTagRelevance, {styles});

declare global {
  interface ComponentTypes {
    PostsItemTagRelevance: typeof PostsItemTagRelevanceComponent
  }
}
