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
  bigCheck: {
    position: 'absolute',
    top: 0,
    left: 2,
    fontSize: '82%',
    opacity: 0,
    transition: `opacity ${theme.voting.strongVoteDelay}ms cubic-bezier(0.74, -0.01, 1, 1) 0ms`,
    height: 23
  },
  bigCheckSolid: {
    fontSize: '65%',
    top: "-45%"
  },
  bigCheckCompleted: {
    // fontSize: '90%',
    // top: '-75%',
    // left: 0
  },
  bigClear: {
    position: 'absolute',
    top: '-70%',
    fontSize: '82%',
    opacity: 0,
    transition: `opacity ${theme.voting.strongVoteDelay}ms cubic-bezier(0.74, -0.01, 1, 1) 0ms`,
  },
  bigClearSolid: {
    fontSize: '65%',
    top: "-45%"
  },
  bigClearCompleted: {
    fontSize: '90%',
    top: '-75%',
  },
  hideIcon: {
    visibility: 'hidden'
  },
  agreeIcon: {
    fontSize: '50%',
    opacity: 0.6,
    height: 15
  },
  disagreeIcon: {
    fontSize: '40%',
    opacity: 0.6
  },
  smallCheckBigVoted: {
    fontSize: '50%',
    opacity: 0.6,
    position: 'relative',
    top: -7,
    left: -14,
    height: 14
  },
  smallArrowBigVoted: {
    fontSize: '50%',
    opacity: 0.6,
    position: 'relative',
    transform: 'rotate(-90deg)',
    height: 14,
    top: -7,
    left: -2
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
  },
  bigVoteAgreementButtons: { // necessary? unclear
    marginLeft: 6
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
    if (voteDimension === 'Overall') {
      return document.currentUserVote === type
    } else {
      return document.currentUserVotesRecord?.[voteDimension] === type
    }
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
    // smallIconAgreementClass is the icon for Agreement smallVotes. Unlike the logic for Overall votes, we just
    // hide this icon while bigVotes are displayed, and we use a different element to show the faded-looking
    // small icon next to the big one.
    const smallIconAgreementClass = (() => {
      // TODO: this is not viable – I'll need to use a useState thing for this, or something
      // if (bigVotingTransition || bigVoted) {
      //   // There should be a pretty transition later, but while the UI is experimental and may change drastically,
      //   // just hide the small icon during the transition
      //   return classes.hideIcon;
      // }
      if (orientation === 'left') {
        return classes.disagreeIcon
      } else { // orientation === 'right'
        return classes.agreeIcon
      }
    })()

    // if (bigVotingTransition || bigVoted) {
    //   // There should be a pretty transition later, but while the UI is experimental and may change drastically,
    //   // just hide the small icon during the transition
    //   setSmallIconAgreementClass(classes.hideIcon)
    // }
    // if (orientation === 'left') {
    //   setSmallIconAgreementClass(classes.disagreeIcon)
    // } else { // orientation === 'right'
    //   setSmallIconAgreementClass(classes.agreeIcon)
    // }

    // bigVotedSmallIconAgreementClass shows the small faded icon behind/next to the vivid bigVoted icon
    const bigVotedSmallIconAgreementClass = (() => {
      if (orientation === 'left') {
        return [classes.smallArrowBigVoted, classes.left]
      } else { // orientation === 'right'
        return classes.smallCheckBigVoted
      }
    })()

    const BigVotedSmallIcon = (() => {
      if (orientation === "left") {
        return UpArrowIcon
      } else {
        return CheckIcon
      }
    })()

    const Icon = (() => {
      if (orientation === "left") {
        return ClearIcon
      } else {
        return CheckIcon
      }
    })()

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
          className={classNames(smallIconAgreementClass, {[classes.hideIcon]: bigVotingTransition || bigVoted})}
          color={voted ? color : 'inherit'}
          viewBox='6 6 12 12'
        />
        <Transition in={!!(bigVotingTransition || bigVoted)} timeout={theme.voting.strongVoteDelay}>
          {(state) => (
            <span className={classes.bigVoteAgreementButtons}>
              <BigVotedSmallIcon
                className={classNames({[bigVotedSmallIconAgreementClass]: bigVoted, [classes.hideIcon]: !bigVoted})}
                color={voted ? color : 'inherit'}
                viewBox='6 6 12 12'
              />
              <Icon
                style={bigVoteCompleted ? {color: theme.palette[color].light} : {}}
                className={classNames(classes.bigCheck, {
                  [classes.bigCheckCompleted]: bigVoteCompleted,
                  [classes.bigCheckSolid]: solidArrow
                }, classes[state])}
                color={(bigVoted || bigVoteCompleted) ? color : 'inherit'}
                viewBox='6 6 12 12'
              />
            </span>)}
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
            style={bigVoteCompleted ? {color: theme.palette[color].light} : {}}
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

