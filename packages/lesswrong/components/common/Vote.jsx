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

  vote(e, type) {

    e.preventDefault();

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
    const isUpvoted = this.hasVoted('upvote');
    const isDownvoted = this.hasVoted('downvote');

    const actionsClass = classNames(
      'vote',
      {voted: isUpvoted || isDownvoted},
      {upvoted: isUpvoted},
      {downvoted: isDownvoted},
    );
    return actionsClass;
  }

  render() {
    return (
      <div className={this.getActionClass()}>
        <div className="vote-count">{this.props.document.baseScore || 0} <span className="vote-count-text">{this.props.document.baseScore === 1 ? "point" : "points"}</span></div>
        <a className="upvote-button" onClick={(e) => this.vote(e,'upvote')}>
          <FontIcon className="material-icons">expand_less</FontIcon>
          <div className="sr-only">Upvote</div>
        </a>
        <a className="downvote-button" onClick={(e) => this.vote(e,'downvote')}>
          <FontIcon className="material-icons">expand_more</FontIcon>
          <div className="sr-only">Downvote</div>
        </a>
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
