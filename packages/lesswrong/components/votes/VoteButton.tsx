import { registerComponent } from '../../lib/vulcan-lib';
import React, { useState } from 'react';
import classNames from 'classnames';
import { isMobile } from '../../lib/utils/isMobile'
import { withTheme } from '@material-ui/core/styles';
import UpArrowIcon from '@material-ui/icons/KeyboardArrowUp';
import CheckIcon from '@material-ui/icons/Check';
import ClearIcon from '@material-ui/icons/Clear';
import ArrowDropUpIcon from '@material-ui/icons/ArrowDropUp';
import IconButton from '@material-ui/core/IconButton';
import Transition from 'react-transition-group/Transition';
import { useDialog } from '../common/withDialog';
import { useTracking } from '../../lib/analyticsEvents';
import { useCurrentUser } from '../common/withUser';
import {VoteDimensionString} from "../../lib/voting/voteTypes";

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    color: theme.palette.grey[400],
    fontSize: 'inherit',
    width: 'initial',
    height: 'initial',
    padding: 0,
    '&:hover': {
      backgroundColor: 'transparent',
    }
  },
  smallArrow: {
    fontSize: '50%',
    opacity: 0.6
  },
  up: {},
  right: {
    transform: 'rotate(-270deg)',
  },
  down: {
    transform: 'rotate(-180deg)',
  },
  left: {
    transform: 'rotate(-90deg)',
  },
  bigArrow: {
    position: 'absolute',
    top: '-70%',
    fontSize: '82%',
    opacity: 0,
    transition: `opacity ${theme.voting.strongVoteDelay}ms cubic-bezier(0.74, -0.01, 1, 1) 0ms`,
  },
  bigArrowSolid: {
    fontSize: '65%',
    top: "-45%"
  },
  bigArrowCompleted: {
    fontSize: '90%',
    top: '-75%',
  },
  // Classes for the animation transitions of the bigArrow. See Transition component
  entering: {
    opacity: 1
  },
  entered: {
    opacity: 1
  },
  exiting: {
    transition: 'opacity 150ms cubic-bezier(0.74, -0.01, 1, 1) 0ms',
  }
})

const VoteButton = <T extends VoteableTypeClient>({
  vote, collectionName, document, voteType,
  color = "secondary",
  orientation = "up",
  voteDimension = "Overall",
  solidArrow,
  theme,
  classes,
}: {
  vote: (props: {document: T, voteType: string|null, voteDimension: VoteDimensionString, collectionName: CollectionNameString, currentUser: UsersCurrent})=>void,
  collectionName: CollectionNameString,
  document: T,
  
  voteType: string,
  color: "error"|"primary"|"secondary",
  orientation: string,
  voteDimension: VoteDimensionString
  solidArrow?: boolean
  // From withTheme. TODO: Hookify this.
  theme?: ThemeType
  classes: ClassesType
}) => {
  const currentUser = useCurrentUser();
  const { openDialog } = useDialog();
  const { captureEvent } = useTracking();
  const [votingTransition, setVotingTransition] = useState<any>(null);
  const [bigVotingTransition, setBigVotingTransition] = useState(false);
  const [bigVoteCompleted, setBigVoteCompleted] = useState(false);

  const handleMouseDown = () => { // This handler is only used on desktop
    if(!isMobile()) {
      setBigVotingTransition(true);
      setVotingTransition(setTimeout(() => {
        setBigVoteCompleted(true);
      }, theme.voting.strongVoteDelay))
    }
  }

  const clearState = () => {
    clearTimeout(votingTransition);
    setBigVotingTransition(false);
    setBigVoteCompleted(false);
  }

  const wrappedVote = (voteType: string) => {
    if(!currentUser){
      openDialog({
        componentName: "LoginPopup",
        componentProps: {}
      });
    } else {
      vote({document, voteType: voteType, voteDimension, collectionName, currentUser});
      captureEvent("vote", {collectionName, voteDimension});
    }
  }

  const handleMouseUp = () => { // This handler is only used on desktop
    if(!isMobile()) {
      if (bigVoteCompleted) {
        wrappedVote(`big${voteType}`)
      } else {
        wrappedVote(`small${voteType}`)
      }
      clearState()
    }
  }

  const hasVoted = (type: string, voteDimension: VoteDimensionString) => {
    return document.currentUserVote
  }

  const smallVoteType = `small${voteType}`
  const bigVoteType = `big${voteType}`
  const voted = hasVoted(smallVoteType, voteDimension) || hasVoted(bigVoteType, voteDimension)
  const bigVoted = hasVoted(bigVoteType, voteDimension)
  
  const handleClick = () => { // This handler is only used for mobile
    if(isMobile()) {
      // This causes the following behavior (repeating after 3rd click):
      // 1st Click: small upvote; 2nd Click: big upvote; 3rd Click: cancel big upvote (i.e. going back to no vote)
      if (voted) {
        wrappedVote(`big${voteType}`)
      } else {
        wrappedVote(`small${voteType}`)
      }
      clearState()
    }
  }

  
  if (voteDimension === "Agreement") {
  
    const Icon = (orientation === "left") ? ClearIcon : CheckIcon
    
    return (
      <IconButton
        className={classNames(classes.root)}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseOut={clearState}
        onClick={handleClick}
        disableRipple
      >
        <Icon
          className={classes.smallArrow}
          color={voted ? color : 'inherit'}
          viewBox='6 6 12 12'
        />
        <Transition in={!!(bigVotingTransition || bigVoted)} timeout={theme.voting.strongVoteDelay}>
          {(state) => (
            <Icon
              style={{color: bigVoteCompleted && theme.palette[color].light}}
              className={classNames(classes.bigArrow, {
                [classes.bigArrowCompleted]: bigVoteCompleted,
                [classes.bigArrowSolid]: solidArrow
              }, classes[state])}
              color={(bigVoted || bigVoteCompleted) ? color : 'inherit'}
              viewBox='6 6 12 12'
            />)}
        </Transition>
      </IconButton>
    )
  } 
  
  const Icon = solidArrow ? ArrowDropUpIcon : UpArrowIcon
  
  return (
    <IconButton
      className={classNames(classes.root, classes[orientation])}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseOut={clearState}
      onClick={handleClick}
      disableRipple
    >
      <Icon
        className={classes.smallArrow}
        color={voted ? color : 'inherit'}
        viewBox='6 6 12 12'
      />
      <Transition in={!!(bigVotingTransition || bigVoted)} timeout={theme.voting.strongVoteDelay}>
        {(state) => (
          <UpArrowIcon
            style={{color: bigVoteCompleted && theme.palette[color].light}}
            className={classNames(classes.bigArrow, {[classes.bigArrowCompleted]: bigVoteCompleted, [classes.bigArrowSolid]: solidArrow}, classes[state])}
            color={(bigVoted || bigVoteCompleted) ? color : 'inherit'}
            viewBox='6 6 12 12'
          />)}
      </Transition>
    </IconButton>
  )
}

const VoteButtonComponent = registerComponent('VoteButton', VoteButton, {
  styles,
  hocs: [withTheme()]
});

declare global {
  interface ComponentTypes {
    VoteButton: typeof VoteButtonComponent
  }
}

