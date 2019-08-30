import { registerComponent } from 'meteor/vulcan:core';
import React, { PureComponent } from 'react';
import classNames from 'classnames';
import { hasVotedClient } from '../../lib/modules/vote.js';
import { isMobile } from '../../lib/modules/utils/isMobile.js'
import { withStyles, withTheme } from '@material-ui/core/styles';
import UpArrowIcon from '@material-ui/icons/KeyboardArrowUp'
import IconButton from '@material-ui/core/IconButton';
import Transition from 'react-transition-group/Transition';
import withDialog from '../common/withDialog';

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

class VoteButton extends PureComponent {
  constructor() {
    super();
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
    const { classes, orientation = 'up', theme, color = "secondary", voteType } = this.props
    const voted = this.hasVoted(`small${voteType}`) || this.hasVoted(`big${voteType}`)
    const bigVoted = this.hasVoted(`big${voteType}`)
    const { bigVotingTransition, bigVoteCompleted } = this.state
    return (
        <IconButton
          className={classNames(classes.root, classes[orientation])}
          onMouseDown={this.handleMouseDown}
          onMouseUp={this.handleMouseUp}
          onMouseOut={this.clearState}
          onClick={this.handleClick}
          disableRipple
        >
          <UpArrowIcon
            className={classes.smallArrow}
            color={voted ? color : 'inherit'}
            viewBox='6 6 12 12'
          />
          <Transition in={!!(bigVotingTransition || bigVoted)} timeout={theme.voting.strongVoteDelay}>
            {(state) => (
              <UpArrowIcon
                style={{color: bigVoteCompleted && theme.palette[color].light}}
                className={classNames(classes.bigArrow, {[classes.bigArrowCompleted]: bigVoteCompleted}, classes[state])}
                color={(bigVoted || bigVoteCompleted) ? color : 'inherit'}
                viewBox='6 6 12 12'
              />)}
          </Transition>
        </IconButton>
  )}
}

registerComponent('VoteButton', VoteButton,
  withDialog,
  withStyles(styles, { name: "VoteButton" }),
  withTheme
);
