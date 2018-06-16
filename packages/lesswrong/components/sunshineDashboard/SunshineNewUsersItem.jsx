/* global confirm */
import { Components, registerComponent, withEdit, withCurrentUser } from 'meteor/vulcan:core';
import React, { Component } from 'react';
import Users from 'meteor/vulcan:users';
import { Link } from 'react-router'
import FontIcon from 'material-ui/FontIcon';
import moment from 'moment';
import PropTypes from 'prop-types';

class SunshineNewUsersItem extends Component {

  handleReview = () => {
    const { currentUser, user, editMutation } = this.props
    editMutation({
      documentId: user._id,
      set: {reviewedByUserId: currentUser._id},
      unset: {}
    })
  }

  handlePurge = () => {
    const { currentUser, user, editMutation } = this.props
    if (confirm("Are you sure you want to delete all this user's posts, comments and votes?")) {
      editMutation({
        documentId: user._id,
        set: {
          reviewedByUserId: currentUser._id,
          nullifyVotes: true,
          voteBanned: true,
          deleteContent: true,
          banned: moment().add(12, 'months').toDate()
        },
        unset: {}
      })
    }
  }

  render () {
    const { user } = this.props

    const {
      bigUpvote = [],
      smallUpvote = [],
      bigDownvote = [],
      smallDownvote = []
    } = _.groupBy( user.allVotes, (vote) => { return vote.voteType})

    const bigUpvotesOther = (bigUpvote.length) - (user.postCount || 0) - (user.commentCount || 0)

    return (
      <div className="sunshine-sidebar-item new-user">
        <Link to={Users.getProfileUrl(user)}
          className="sunshine-sidebar-username">
            {user.displayName}
        </Link>
        <div className="sunshine-sidebar-content-hoverover user">
          <Link to={Users.getProfileUrl(user)}>
            <h4>{ user.displayName }</h4>
          </Link>
          <div>Posts: { user.postCount || 0 }</div>
          <div>Comments: { user.commentCount || 0 }</div>
          <hr />
          <div>Big Upvotes: { bigUpvotesOther } { bigUpvote.length ? <span>({ bigUpvote.length } total)</span>  : null}</div>
          <div>Upvotes: { smallUpvote.length }</div>
          <div>Big Downvotes: { bigDownvote.length }</div>
          <div>Downvotes: { smallDownvote.length }</div>

        </div>
        <div className="sunshine-sidebar-item-meta">
          <span className="karma">
            { user.karma || 0 }
          </span>
          <span className="email">
            { user.email }
          </span>
          <span className="created-at">
            { moment(new Date(user.createdAt)).fromNow() }
          </span>
          <span className="votes">
            { user.allVotes.length } votes
          </span>
        </div>
        <div className="sunshine-sidebar-posts-actions new-user">
          <div
            className="sunshine-sidebar-posts-action purge"
            title="Purge User (delete and ban)"
            onClick={this.handlePurge}>
              <FontIcon
                style={{fontSize: "18px", color:"rgba(0,0,0,.25)"}}
                className="material-icons">
                  delete_forever
              </FontIcon>
              <div className="sunshine-sidebar-posts-item-delete-overlay" />
          </div>
          <span
            className="sunshine-sidebar-posts-action review"
            title="Mark as Reviewed"
            onClick={this.handleReview}>
            <FontIcon
              style={{fontSize: "18px", color:"rgba(0,0,0,.25)"}}
              className="material-icons">
                done
            </FontIcon>
          </span>
        </div>
      </div>
    )
  }
}

SunshineNewUsersItem.propTypes = {
  user: PropTypes.object.isRequired,
}

const withEditOptions = {
  collection: Users,
  fragmentName: 'SunshineUsersList',
}
registerComponent('SunshineNewUsersItem', SunshineNewUsersItem, [withEdit, withEditOptions], withCurrentUser);
