/* global confirm */
import { Components, registerComponent, withUpdate } from 'meteor/vulcan:core';
import React, { Component } from 'react';
import Users from 'meteor/vulcan:users';
import { Link } from '../../lib/reactRouterWrapper.js'
import moment from 'moment';
import PropTypes from 'prop-types';
import Typography from '@material-ui/core/Typography';
import withUser from '../common/withUser';
import withHover from '../common/withHover'
import withErrorBoundary from '../common/withErrorBoundary'
import red from '@material-ui/core/colors/red';
import { withStyles } from '@material-ui/core/styles';

const styles = theme => ({
  negativeKarma: {
     color: red['A100']
  },
  info: {
    // Wrap between MetaInfo elements. Non-standard CSS which may not work in Firefox.
    wordBreak: "break-word",
    display: "inline-block"
  },
})
class SunshineNewUsersItem extends Component {
  state = {hidden: false}

  handleReview = () => {
    const { currentUser, user, updateUser } = this.props
    updateUser({
      selector: {_id: user._id},
      data: {reviewedByUserId: currentUser._id}
    })
  }

  handlePurge = async () => {
    const { currentUser, user, updateUser } = this.props
    if (confirm("Are you sure you want to delete all this user's posts, comments and votes?")) {
      this.setState({hidden: true})
      await updateUser({
        selector: {_id: user._id},
        data: {
          reviewedByUserId: currentUser._id,
          nullifyVotes: true,
          voteBanned: true,
          deleteContent: true,
          banned: moment().add(12, 'months').toDate()
        }
      })
    }
  }

  render () {
    const { user, hover, anchorEl, classes, currentUser, allowContentPreview=true } = this.props
    const showNewUserContent = allowContentPreview && currentUser?.sunshineShowNewUserContent

    const { SunshineListItem, SidebarHoverOver, MetaInfo, SidebarActionMenu, SidebarAction, FormatDate, SunshineNewUserPostsList, SunshineNewUserCommentsList } = Components

    if (this.state.hidden) { return null }

    return (
        <SunshineListItem hover={hover}>
          <SidebarHoverOver hover={hover} anchorEl={anchorEl}>
            <Typography variant="body1">
              <MetaInfo>
                <div>ReCaptcha Rating: {user.signUpReCaptchaRating || "no rating"}</div>
                <div>Posts: { user.postCount || 0 }</div>
                <div>Comments: { user.commentCount || 0 }</div>
                <hr />
                <div>Big Upvotes: { user.bigUpvoteCount || 0 }</div>
                <div>Upvotes: { user.smallUpvoteCount || 0 }</div>
                <div>Big Downvotes: { user.bigDownvoteCount || 0 }</div>
                <div>Downvotes: { user.smallDownvoteCount || 0 }</div>
                {!showNewUserContent && <React.Fragment>
                  <div dangerouslySetInnerHTML={{__html: user.htmlBio}}/>
                  <SunshineNewUserPostsList terms={{view:"sunshineNewUsersPosts", userId: user._id}}/>
                  <SunshineNewUserCommentsList terms={{view:"sunshineNewUsersComments", userId: user._id}}/>
                </React.Fragment>}
              </MetaInfo>
            </Typography>
          </SidebarHoverOver>
          <div>
            <MetaInfo className={classes.info}>
              { user.karma || 0 }
            </MetaInfo>
            <MetaInfo className={classes.info}>
              <Link className={user.karma < 0 ? classes.negativeKarma : ""} to={Users.getProfileUrl(user)}>
                  {user.displayName}
              </Link>
            </MetaInfo>
            <MetaInfo className={classes.info}>
              <FormatDate date={user.createdAt}/>
            </MetaInfo>
            <MetaInfo className={classes.info}>
              { user.email }
            </MetaInfo>
          </div>
          {showNewUserContent &&
            <div>
              <div dangerouslySetInnerHTML={{__html: user.htmlBio}}/>
              <SunshineNewUserPostsList truncated={true} terms={{view:"sunshineNewUsersPosts", userId: user._id}}/>
              <SunshineNewUserCommentsList truncated={true} terms={{view:"sunshineNewUsersComments", userId: user._id}}/>
            </div>
          }
          { hover && <SidebarActionMenu>
            <SidebarAction title="Review" onClick={this.handleReview}>
              done
            </SidebarAction>
            <SidebarAction warningHighlight={true} title="Purge User (delete and ban)" onClick={this.handlePurge}>
              delete_forever
            </SidebarAction>
          </SidebarActionMenu>}
        </SunshineListItem>
    )
  }
}

SunshineNewUsersItem.propTypes = {
  user: PropTypes.object.isRequired,
  hover: PropTypes.bool.isRequired,
  anchorEl: PropTypes.object,
  currentUser: PropTypes.object.isRequired,
  updateUser: PropTypes.func.isRequired,
}

const withUpdateOptions = {
  collection: Users,
  fragmentName: 'SunshineUsersList',
}
registerComponent('SunshineNewUsersItem', SunshineNewUsersItem, [withUpdate, withUpdateOptions], withUser, withHover, withErrorBoundary, withStyles(styles, {name:"SunshineNewUsersItem"}));
