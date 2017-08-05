import { Components, registerComponent, withCurrentUser, withList, withEdit, withMessages } from 'meteor/vulcan:core';
import React, { PropTypes, Component } from 'react';
import { Link } from 'react-router';
import { FormattedMessage } from 'react-intl';
import { Meteor } from 'meteor/meteor';
import { Dropdown, MenuItem, DropdownButton } from 'react-bootstrap';
import Votes from './collection.js';
import classNames from 'classnames';
import { hasUpvotedNew, hasDownvotedNew, log } from './helpers.js';
import withVote from './withVote.js';

class KarmaVoting extends Component {
  constructor(props, context) {
    super(props, context);
    this.upvote = this.upvote.bind(this);
    this.getActionClass = this.getActionClass.bind(this);
    this.downvote = this.downvote.bind(this);

    this.state = {
      loading: false
    };
  }

  // Render the karma voting interface.
  render() {
    // Get the results of the votes query.
    const results = this.props.results;
    const document = this.props.document;
    log("results", results);
    // The displayed score is the sum of all of the weights of the votes.
    const weights = _.reduce(results,
      function(acc, vote) {
        // log("vote", vote.weight);
        newWeight = vote.documentId == document._id ? vote.weight + acc : acc;
        return newWeight;
      }, 0);
    const score = Math.ceil(weights);
    // log("weights", weights, "score", score);

    // Return html.
    return (
      <div className={this.getActionClass()}>
        <a className="upvote-button" onClick={this.upvote}>
            {this.state.loading ? <Components.Icon name="spinner" /> : <Components.Icon name="upvote" /> }
            <div className="sr-only">Upvote</div>
        </a>
            <div className="vote-count">{score || 0}</div>
        <a className="downvote-button" onClick={this.downvote}>
            {this.state.loading ? <Components.Icon name="spinner" /> : <Components.Icon name="downvote" /> }
            <div className="sr-only">Downvote</div>
        </a>
      </div>
    );
  }



  // Downvote function.
  downvote(e) {
    const document = this.props.document;
    const collection = this.props.collection;
    const user = this.props.currentUser;
    const results = this.props.results;

    if(!user){
      this.props.flash("Please log in");
      // this.stopLoading();
    } else {
      const voteType = hasDownvotedNew(user, results) ? "cancelDownvote" : "downvote";
      this.props.newVote({document, voteType, collection, currentUser: this.props.currentUser}).then(result => {
        // Update the vote count.
      });
    }
  }

  getActionClass() {
    const user = this.props.currentUser;
    const results = this.props.results;

    const isUpvoted = hasUpvotedNew(user, results);
    const isDownvoted = hasDownvotedNew(user, results);
    const actionsClass = classNames(
      'vote',
      {voted: isUpvoted || isDownvoted},
      {upvoted: isUpvoted},
      {downvoted: isDownvoted}
    );

    return actionsClass;
  }

  // Upvote function.
  upvote(e) {
    log("upvote!");
    const document = this.props.document;
    const collection = this.props.collection;
    const user = this.props.currentUser;
    const results = this.props.results;

    if(!user) {
      this.props.flash("Please log in");
      // this.stopLoading();
    } else {
      const voteType = hasUpvotedNew(user, results) ? "cancelUpvote" : "upvote";
      const prom = this.props.newVote({documentId: document._id, documentType: collection.typeName,
         userId: user._id, voteType, weight: 1});
      log("prom", prom);
      prom.then(result => {
        log("update the vote count");
        // Update the vote count.
      });
    }
  }

}

const withListOptions = {
  collection: Votes,
  queryName: 'votesListQuery',
  fragmentName: 'voteComponentFragment'
};

const withEditOptions = {
  collection: Votes,
  fragmentName: 'voteComponentFragment',
};

registerComponent('Vote', KarmaVoting, withList(withListOptions), withEdit(withEditOptions), withCurrentUser, withVote, withMessages);
