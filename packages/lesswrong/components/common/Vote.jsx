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
  }

  vote(e, type, canBigVote) {

    e.preventDefault();

    const document = this.props.document;
    const collection = this.props.collection;
    const user = this.props.currentUser;
    let newType = _.clone(type)

    if(!user){
      this.props.flash(this.context.intl.formatMessage({id: 'users.please_log_in'}));
    } else {
      console.log(canBigVote)
      switch (type) {
        case "bigUpvote":
          if (canBigVote) {
            return this.props.vote({document, voteType: newType, collection, currentUser: this.props.currentUser});
          }
          newType = "smallUpvote"
          break;
        case "bigDownvote":
          if (canBigVote) {
            return this.props.vote({document, voteType: newType, collection, currentUser: this.props.currentUser});
          }
          newType = "smallDownvote"
          break;
        default:
          break;
      }
      this.props.vote({document, voteType: newType, collection, currentUser: this.props.currentUser});
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
          <a className="big-downvote-button" onClick={(e) => this.vote(e,'bigDownvote', this.getActionClass().includes("smallDownvoted"))}>
            <FontIcon className="material-icons">arrow_back_ios</FontIcon>
            <div className="sr-only">Big Downvote</div>
          </a>
          <a className="small-downvote-button" onClick={(e) => this.vote(e,'smallDownvote')}>
            <FontIcon className="material-icons">arrow_left</FontIcon>
            <div className="sr-only">Small Downvote</div>
          </a>
        </span>
        <div className="vote-count">
          {this.props.document.baseScore || 0}
        </div>
        <span className="upvote-buttons">
          <a className="small-upvote-button" onClick={(e) => this.vote(e,'smallUpvote')}>
            <FontIcon className="material-icons">arrow_right</FontIcon>
            <div className="sr-only">Small Upvote</div>
          </a>
          <a className="big-upvote-button" onClick={(e) => this.vote(e,'bigUpvote', this.getActionClass().includes("smallUpvoted"))}>
            <FontIcon className="material-icons">arrow_forward_ios</FontIcon>
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
