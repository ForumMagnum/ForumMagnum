import { registerComponent } from '../../lib/vulcan-lib';
import React, { PureComponent } from 'react';
import classNames from 'classnames';
import { hasVotedClient } from '../../lib/voting/vote';
import { isMobile } from '../../lib/utils/isMobile'
import { withTheme } from '@material-ui/core/styles';
import UpArrowIcon from '@material-ui/icons/KeyboardArrowUp';
import ArrowDropUpIcon from '@material-ui/icons/ArrowDropUp';
import IconButton from '@material-ui/core/IconButton';
import Transition from 'react-transition-group/Transition';
import withDialog from '../common/withDialog';
import { withTracking } from "../../lib/analyticsEvents";

const styles = theme => ({
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

interface ExternalProps {
  vote: any,
  collection: any,
  document: any,
  voteType: string,
  color: any,
  orientation: string,
  currentUser: UsersCurrent|null,
  solidArrow?: boolean
}
interface VoteButtonProps extends ExternalProps, WithStylesProps, WithDialogProps, WithTrackingProps {
  theme: any,
}
interface VoteButtonState {
  voted: boolean,
  bigVoted: boolean,
  bigVotingTransition: boolean,
  bigVoteCompleted: boolean,
}

class VoteButton extends PureComponent<VoteButtonProps,VoteButtonState> {
  votingTransition: any

  constructor(props: VoteButtonProps) {
    super(props);
    this.votingTransition = null
    this.state = {
      voted: false,
      bigVoted: false,
      bigVotingTransition: false,
      bigVoteCompleted: false,
    };
  }

  handleMouseDown = () => { // This handler is only used on desktop
    const { theme } = this.props
    if(!isMobile()) {
      this.setState({bigVotingTransition: true})
      this.votingTransition = setTimeout(() => {this.setState({bigVoteCompleted: true})}, theme.voting.strongVoteDelay)
    }
  }

  clearState = () => {
    clearTimeout(this.votingTransition)
    this.setState({bigVotingTransition: false, bigVoteCompleted: false})
  }

  vote = (type) => {
    const document = this.props.document;
    const collection = this.props.collection;
    const user = this.props.currentUser;
    if(!user){
      this.props.openDialog({
        componentName: "LoginPopup",
        componentProps: {}
      });
    } else {
      this.props.vote({document, voteType: type, collection, currentUser: this.props.currentUser});
      this.props.captureEvent("vote", {collectionName: collection.collectionName});
    }
  }

  handleMouseUp = () => { // This handler is only used on desktop
    if(!isMobile()) {
      const { voteType } = this.props
      const { bigVoteCompleted } = this.state
      if (bigVoteCompleted) {
        this.vote(`big${voteType}`)
      } else {
        this.vote(`small${voteType}`)
      }
      this.clearState()
    }
  }

  handleClick = () => { // This handler is only used for mobile
    if(isMobile()) {
      const { voteType } = this.props
      // This causes the following behavior (repeating after 3rd click):
      // 1st Click: small upvote; 2nd Click: big upvote; 3rd Click: cancel big upvote (i.e. going back to no vote)
      const voted = this.hasVoted(`big${voteType}`) || this.hasVoted(`small${voteType}`)
      if (voted) {
        this.vote(`big${voteType}`)
      } else {
        this.vote(`small${voteType}`)
      }
      this.clearState()
    }
  }

  hasVoted = (type) => {
    return hasVotedClient({document: this.props.document, voteType: type})
  }

  render() {
    const { classes, orientation = 'up', theme, color = "secondary", voteType, solidArrow } = this.props
    const voted = this.hasVoted(`small${voteType}`) || this.hasVoted(`big${voteType}`)
    const bigVoted = this.hasVoted(`big${voteType}`)
    const { bigVotingTransition, bigVoteCompleted } = this.state

    const Icon = solidArrow ? ArrowDropUpIcon :UpArrowIcon
    return (
        <IconButton
          className={classNames(classes.root, classes[orientation])}
          onMouseDown={this.handleMouseDown}
          onMouseUp={this.handleMouseUp}
          onMouseOut={this.clearState}
          onClick={this.handleClick}
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
  )}
}

const VoteButtonComponent = registerComponent<ExternalProps>('VoteButton', VoteButton, {
  styles,
  hocs: [withDialog, withTheme(), withTracking]
});

declare global {
  interface ComponentTypes {
    VoteButton: typeof VoteButtonComponent
  }
}

