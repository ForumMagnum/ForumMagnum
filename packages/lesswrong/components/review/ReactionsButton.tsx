import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import type { vote } from './ReviewVotingPage';
import classNames from 'classnames';
import * as _ from "underscore"

const styles = (theme: ThemeType) => ({
  root: {
    ...theme.typography.commentStyle,
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'white',
    marginRight: 4,
    marginLeft: 4,
    marginBottom: 4,
    boxShadow: '0px 1px 5px 0px rgba(0, 0, 0, 0.2)',
    cursor: 'pointer',
    '&:hover': {
      backgroundColor: 'rgba(240,240,240,1)'
    }
  },
  active: {
    color: 'white',
    backgroundColor: 'rgba(50, 50, 50, 1)',
    '&:hover': {
      backgroundColor: 'rgba(100,100,100,1)'
    }
  }
})


const ReactionsButton = ({classes, postId, vote, votes, reaction }: {classes: ClassesType, postId: string, vote: any, votes: vote[], reaction: string}) => {
  const voteForCurrentPost = votes.find(vote => vote.postId === postId)
  const currentReactions = voteForCurrentPost?.reactions || []
  const createClickHandler = (postId: string, reactions: string[], voteId: string | undefined, score: number | undefined) => {
      return () => {
        vote({postId, reactions, _id: voteId, previousValue: score})
      }
  }
  return <span 
    className={classNames(classes.root, {[classes.active]: currentReactions.includes(reaction)})}
    onClick={createClickHandler(postId, currentReactions.includes(reaction) ? _.without(currentReactions, reaction) : [...currentReactions, reaction], voteForCurrentPost?._id, voteForCurrentPost?.score)}
  >
    <span>{reaction}</span>
  </span>
}

const ReactionsButtonComponent = registerComponent("ReactionsButton", ReactionsButton, {styles});

declare global {
  interface ComponentTypes {
    ReactionsButton: typeof ReactionsButtonComponent
  }
}
