/*
The original Newsletter components is defined using an
ES6 class, so we use the "class foo extends bar" syntax
to extend it. This way, we can simply redefine the
render method to change it, while preserving
all of the class's other methods (other render
functions, event handlers, etc.).
*/

import { Components, getRawComponent, replaceComponent }from 'meteor/nova:core';
import React, { PropTypes, Component } from 'react';
import classNames from 'classnames';
import { withCurrentUser, withMessages } from 'meteor/nova:core';
import { withVote, hasUpvoted, hasDownvoted } from 'meteor/nova:voting';


class LWVote extends getRawComponent('Vote') {

  constructor() {
    super();
    this.downvote = this.downvote.bind(this);
  }

  render() {
    // console.log(this.renderButton); <-- exists

    return this.state.showBanner
      ? (
        <div className="newsletter">
          <h4 className="newsletter-tagline">✉️<FormattedMessage id="newsletter.subscribe_prompt"/>✉️</h4>
          {this.props.currentUser ? this.renderButton() : this.renderForm()}
          <a onClick={this.dismissBanner} className="newsletter-close"><Components.Icon name="close"/></a>
        </div>
      ) : null;
  }

  downvote(e) {
    e.preventDefault();

    this.startLoading();

    const post = this.props.post;
    const user = this.props.currentUser;

    if(!user){
      this.props.flash("Please log in first");
      this.stopLoading();
    } else {
      const voteType = this.hasDownvoted(user, post) ? "cancelDownvote" : "downvote";
      this.props.vote({post, voteType, currentUser: this.props.currentUser}).then(result => {
        this.stopLoading();
      });
    }
  }

  render() {

    // uncomment for debug:
    // console.log('hasUpvoted', hasUpvoted);
    // console.log('this.hasUpvoted', this.hasUpvoted);

    const post = this.props.post;
    const user = this.props.currentUser;

    const hasUpvoted = this.hasUpvoted(user, post);
    const hasDownvoted = this.hasDownvoted(user, post);
    const actionsClass = classNames(
      "vote",
      {voted: hasUpvoted || hasDownvoted},
      {upvoted: hasUpvoted},
      {downvoted: hasDownvoted}
    );

    return (
      <div className={actionsClass}>
        <a className="upvote-button" onClick={this.upvote}>
          {this.state.loading ? <Components.Icon name="spinner" /> : <Components.Icon name="upvote" /> }
          <div className="sr-only">Upvote</div>
        </a>
        <div className="vote-count">{post.baseScore || 0}</div>
        <a className="downvote-button" onClick={this.downvote}>
          {this.state.loading ? <Components.Icon name="spinner" /> : <Components.Icon name="downvote" /> }
          <div className="sr-only">Downvote</div>
        </a>
      </div>
    )
  }

}

replaceComponent('Vote', LWVote);
