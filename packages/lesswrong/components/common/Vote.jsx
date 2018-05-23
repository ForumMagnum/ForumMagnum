import { Components, registerComponent, withMessages } from 'meteor/vulcan:core';
import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { withVote, hasVotedClient } from 'meteor/vulcan:voting';
import { /*FormattedMessage,*/ intlShape } from 'meteor/vulcan:i18n';

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
    if (this.state.bigDownvoting >= 9) {
      this.vote("bigDownvote")
    } else {
      this.vote("smallDownvote")
    }
    this.clearState()
  }

  endBigUpvoting = () => {
    if (this.state.bigUpvoting >= 9) {
      this.vote("bigUpvote")
    } else {
      this.vote("smallUpvote")
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
    if (this.state.bigDownvoting < 9) {
      this.setState({bigDownvoting: this.state.bigDownvoting + 1})
    }
    this.bigVotingTimer = setTimeout(this.repeatDownvoting, 60)
  }

  repeatUpvoting = () => {
    if (this.state.bigUpvoting < 9) {
      this.setState({bigUpvoting: this.state.bigUpvoting + 1})
    }
    this.bigVotingTimer = setTimeout(this.repeatUpvoting, 60)
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
      this.props.flash(this.context.intl.formatMessage({id: 'users.please_log_in'}));
    } else {
      this.props.vote({document, voteType: type, collection, currentUser: this.props.currentUser});
    }
  }

  hasVoted(type) {
    return hasVotedClient({document: this.props.document, voteType: type})
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

  render() {
    return (
      <div className={this.getActionClass()}>
        <span className="downvote-buttons">
          <a className="big-downvote-button">
            <FontIcon className={`material-icons big-voting${this.state.bigDownvoting}`}>
              arrow_back_ios
            </FontIcon>
            <div className="sr-only">Big Downvote</div>
          </a>
          <a className="small-downvote-button">
            <div className="voting-button"
              onMouseDown={this.repeatDownvoting}
              onMouseUp={this.endBigDownvoting}
              onMouseOut={this.clearState}
            />
            <FontIcon className="material-icons">arrow_back_ios</FontIcon>
            <div className="sr-only">Small Downvote</div>
          </a>
        </span>
        <div className="vote-count">
          {this.props.document.baseScore || 0}
        </div>
        <span className="upvote-buttons">
          <a className="small-upvote-button">
            <FontIcon className={`material-icons big-voting${this.state.bigUpvoting}`}>
              arrow_forward_ios
            </FontIcon>
            <div className="sr-only">Small Upvote</div>
            <div className="voting-button"
              onMouseDown={this.repeatUpvoting}
              onMouseUp={this.endBigUpvoting}
              onMouseOut={this.clearState}
            />
          </a>
          <a className="big-upvote-button">
            <FontIcon className={`material-icons big-voting${this.state.bigUpvoting}`}>
              arrow_forward_ios
            </FontIcon>
            <div className="sr-only">Big Upvote</div>
          </a>
        </span>
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

Vote.contextTypes = {
  intl: intlShape
};

registerComponent('Vote', Vote, withMessages, withVote);
