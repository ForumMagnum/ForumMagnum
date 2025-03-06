import React, { useState } from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import type { SyntheticReviewVote } from './ReviewVotingPage';
import classNames from 'classnames';
import * as _ from "underscore"
import Input from '@material-ui/core/Input';
import InputAdornment from '@material-ui/core/InputAdornment';
import IconButton from '@material-ui/core/IconButton';
import CheckIcon from '@material-ui/icons/Check';

const styles = (theme: ThemeType) => ({
  root: {
    ...theme.typography.commentStyle,
    padding: '5px  8px',
    borderRadius: 3,
    backgroundColor: theme.palette.panelBackground.default,
    marginRight: 4,
    marginLeft: 4,
    marginBottom: 4,
    border: theme.palette.border.commentBorder,
    cursor: 'pointer',
    display: 'inline-block',
    '&:hover': {
      backgroundColor: theme.palette.grey[140],
    }
  },
  active: {
    color: theme.palette.text.invertedBackgroundText,
    backgroundColor: theme.palette.primary.dark,
    '&:hover': {
      backgroundColor: theme.palette.primary.main
    }
  },
  textEntryOpen: {
    padding: 0,
    paddingLeft: 4
  }
})


const ReactionsButton = ({classes, postId, vote, votes, reaction, freeEntry }: {classes: ClassesType<typeof styles>, postId: string, vote: any, votes: SyntheticReviewVote[], reaction: string, freeEntry: boolean}) => {
  const voteForCurrentPost = votes.find(vote => vote.postId === postId)
  // TODO: This component is unused, except in ReviewVotingPage2019. Cast to any
  // here is a way to make a minimally invasive fix.
  const currentReactions = (voteForCurrentPost as any)?.reactions || []
  const [freeEntryText, setFreeEntryText] = useState("")
  const [textFieldOpen, setTextFieldOpen] = useState(false)
  const createClickHandler = (postId: string, reactions: string[], score: number | undefined) => {
    if (freeEntry) {
      return () => {
        setTextFieldOpen(true)
      }
    } else {
      return () => {
        vote({postId, reactions, previousValue: score})
      }
    }
  }

  const submitFreeEntryText = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (freeEntryText.length > 0) {
      vote({postId, reactions: [...currentReactions, freeEntryText], previousValue: voteForCurrentPost?.score})
    }
    setTextFieldOpen(false)
    setFreeEntryText("")
  }
  
  const handleEnter = (e: React.KeyboardEvent) => {
    if (e.keyCode === 13) {
      void submitFreeEntryText(e)
    }
  }

  return <span 
    className={classNames(classes.root, {[classes.active]: currentReactions.includes(reaction), [classes.textEntryOpen]: textFieldOpen })}
    onClick={createClickHandler(postId, currentReactions.includes(reaction) ? _.without(currentReactions, reaction) : [...currentReactions, reaction], voteForCurrentPost?.score)}
  >
    {textFieldOpen ? <Input
      placeholder={reaction}
      value={freeEntryText}
      onChange={(event) => {
        setFreeEntryText(event.target.value)
      }}
      disableUnderline={true}
      onKeyDown={handleEnter}
      onBlur={e => submitFreeEntryText(e)}
      
      endAdornment={
        <InputAdornment position="end">
          <IconButton
            aria-label="Toggle password visibility"
            onClick={submitFreeEntryText}
          >
            <CheckIcon />
          </IconButton>
        </InputAdornment>
      }
      autoFocus
    /> : <span>{reaction}</span>}
  </span>
}

const ReactionsButtonComponent = registerComponent("ReactionsButton", ReactionsButton, {styles});

declare global {
  interface ComponentTypes {
    ReactionsButton: typeof ReactionsButtonComponent
  }
}

export default ReactionsButtonComponent;
