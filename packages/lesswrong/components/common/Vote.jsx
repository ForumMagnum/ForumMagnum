import { Components, registerComponent, withMessages } from 'meteor/vulcan:core';
import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { withVote, hasVotedClient } from 'meteor/vulcan:voting';
import { isMobile } from '../../lib/modules/utils/isMobile.js'

import FontIcon from 'material-ui/FontIcon';

class Vote extends PureComponent {

constructor() {
  super();
  this.vote = this.vote.bind(this);
  this.getActionClass = this.getActionClass.bind(this);
  this.hasVoted = this.hasVoted.bind(this);

  this.bigVotingTimer = undefined

  this.state = {
    bigUpvoting: 0,
    bigDownvoting: 0,
  };
}

endBigDownvoting = () => {
  if (!isMobile()) {
    if (this.state.bigDownvoting >= 9) {
      this.vote("bigDownvote")
    } else {
      this.vote("smallDownvote")
    }
  }
  this.clearState()
}

endBigUpvoting = () => {
  if (!isMobile()) {
    if (this.state.bigUpvoting >= 9) {
      this.vote("bigUpvote")
    } else {
      this.vote("smallUpvote")
    }
  }
  this.clearState()
}

clearState = () => {
  clearTimeout(this.bigVotingTimer)
  this.setState({
    bigUpvoting: 0,
    bigDownvoting: 0,
  })
}

repeatDownvoting = () => {
  if (!isMobile()) {
    if (this.state.bigDownvoting < 9) {
      this.setState({bigDownvoting: this.state.bigDownvoting + 1})
    }
    this.bigVotingTimer = setTimeout(this.repeatDownvoting, 100)
  }
}

repeatUpvoting = () => {
  if (this.state.bigUpvoting < 9) {
    this.setState({bigUpvoting: this.state.bigUpvoting + 1})
  }
  this.bigVotingTimer = setTimeout(this.repeatUpvoting, 100)
}

showReply(event) {
  event.preventDefault();
  this.setState({showReply: true});
}

vote(type, canBigVote) {
  const document = this.props.document;
  const collection = this.props.collection;
  const user = this.props.currentUser;

  if(!user){
    this.props.flash({id: 'users.please_log_in', type: 'success'});
  } else {
    this.props.vote({document, voteType: type, collection, currentUser: this.props.currentUser});
  }
}

hasVoted = (type) => {
  return hasVotedClient({document: this.props.document, voteType: type})
}

upvoteNext = () => {
  if (isMobile()) {
    if (this.hasVoted("smallUpvote") || this.hasVoted("bigUpvote") ) {
      this.vote("bigUpvote")
    } else {
      this.vote("smallUpvote")
    }
  }
  this.clearState()
}

downvoteNext = () => {
  if (isMobile()) {
    if (this.hasVoted("smallDownvote") || this.hasVoted("bigDownvote") ) {
      this.vote("bigDownvote")
    } else {
      this.vote("smallDownvote")
    }
  }
  this.clearState()
}

getActionClass() {
  const isBigUpvoted = this.hasVoted('bigUpvote');
  const isBigDownvoted = this.hasVoted('bigDownvote');
  const isSmallUpvoted = this.hasVoted('smallUpvote') || this.hasVoted('bigUpvote');
  const isSmallDownvoted = this.hasVoted('smallDownvote') || this.hasVoted('bigDownvote');

  const actionsClass = classNames(
    'vote',
    {voted: isBigUpvoted || isBigDownvoted || isSmallUpvoted || isSmallDownvoted},
    {smallUpvoted: isSmallUpvoted},
    {bigUpvoted: isBigUpvoted},
    {smallDownvoted: isSmallDownvoted},
    {bigDownvoted: isBigDownvoted},
  );
  return actionsClass;
}

renderStrongUpvoteTooltip = () => <div className="voting-tooltip upvote">
  Click-and-hold for strong upvote.
</div>

renderStrongDownvoteTooltip = () => <div className="voting-tooltip downvote">
  Click-and-hold for strong downvote.
</div>

renderVoteInfoTooltip = () => <div className="vote-info-tooltip">
  { this.props.document &&
    this.props.document.allVotes &&
    <div className="votes-count-info">
      {this.props.document.allVotes.length} {this.props.document.allVotes.length == 1 ? "Vote" : "Votes"}
    </div>
  }
</div>

render() {
  const { document } = this.props
  return (
    <div className="vote-wrapper">
      <div className={this.getActionClass()}>
          <span className="downvote-buttons"
            onMouseDown={this.repeatDownvoting}
            onMouseUp={this.endBigDownvoting}
            onMouseOut={this.clearState}
            onClick={this.downvoteNext}
          >
            <Components.Tooltip tooltip={this.renderStrongDownvoteTooltip()} delay={10}>
              <a className="big-downvote-button">
                <FontIcon className={`material-icons big-voting${this.state.bigDownvoting}`}>
                  arrow_back_ios
                </FontIcon>
                <div className="sr-only">Big Downvote</div>
              </a>
              <a className="small-downvote-button">
                <FontIcon className={`material-icons big-voting${this.state.bigDownvoting}`}>
                  arrow_back_ios
                </FontIcon>
                <div className="sr-only">Small Downvote</div>
              </a>
            </Components.Tooltip>

          </span>
        <div className="vote-count">
          <Components.Tooltip tooltip={this.renderVoteInfoTooltip()} delay={10}>
            <span className="vote-count-number">
              {document.baseScore || 0} { document.afBaseScore ? <span>({document.afBaseScore})</span> : null}
            </span>
          </Components.Tooltip>
        </div>
          <span className="upvote-buttons"
            onMouseDown={this.repeatUpvoting}
            onMouseUp={this.endBigUpvoting}
            onMouseOut={this.clearState}
            onClick={this.upvoteNext}
          >
            <Components.Tooltip tooltip={this.renderStrongUpvoteTooltip()} delay={10}>
              <a className="small-upvote-button">
                <FontIcon className={`material-icons big-voting${this.state.bigUpvoting}`}>
                  arrow_forward_ios
                </FontIcon>
                <div className="sr-only">Small Upvote</div>
              </a>
              <a className="big-upvote-button">
                <FontIcon className={`material-icons big-voting${this.state.bigUpvoting}`}>
                  arrow_forward_ios
                </FontIcon>
                <div className="sr-only">Big Upvote</div>
              </a>
            </Components.Tooltip>
        </span>
      </div>
    </div>
  )
}

}

Vote.propTypes = {
  document: PropTypes.object.isRequired, // the document to upvote
  collection: PropTypes.object.isRequired, // the collection containing the document
  vote: PropTypes.func.isRequired, // mutate function with callback inside
  currentUser: PropTypes.object, // user might not be logged in, so don't make it required
};

registerComponent('Vote', Vote, withMessages, withVote);
