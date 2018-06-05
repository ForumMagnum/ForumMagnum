import { Components, getRawComponent, registerComponent, withMessages } from 'meteor/vulcan:core';
import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { withRouter, Link } from 'react-router';
import { FormattedMessage } from 'meteor/vulcan:i18n';
import { Comments, Posts } from "meteor/example-forum";
import moment from 'moment';
import Users from 'meteor/vulcan:users';
import classNames from 'classnames';
import FontIcon from 'material-ui/FontIcon';
import ArrowDropRight from 'material-ui/svg-icons/navigation-arrow-drop-right';
import MoreVertIcon from 'material-ui/svg-icons/navigation/more-vert';
import MenuItem from 'material-ui/MenuItem';
import IconMenu from 'material-ui/IconMenu';
import IconButton from 'material-ui/IconButton';
import FlatButton from 'material-ui/FlatButton';
import Dialog from 'material-ui/Dialog';

const moreActionsMenuStyle = {
  position: 'inherit',
}

const moreActionsMenuButtonStyle = {
  padding: '0px',
  width: 'auto',
  height: 'auto',
}

const moreActionsMenuIconStyle = {
  padding: '0px',
  width: '16px',
  height: '16px',
  color: 'rgba(0,0,0,0.5)',
}

class CommentsItem extends PureComponent {

  constructor(props) {
    super(props);
    this.state = {
      showReply: false,
      showEdit: false,
      showReport: false,
      showStats: false,
    };
  }

  showReport = (event) => {
    event.preventDefault();
    this.setState({showReport: true});
  }

  showStats = (event) => {
    event.preventDefault();
    this.setState({showStats: true});
  }
  hideStats = (event) => {
    this.setState({showStats: false});
  }

  showReply = (event) => {
    event.preventDefault();
    this.setState({showReply: true});
  }

  replyCancelCallback = () => {
    this.setState({showReply: false});
  }

  replySuccessCallback = () => {
    this.setState({showReply: false});
  }

  showEdit = (event) => {
    event.preventDefault();
    this.setState({showEdit: true});
  }

  editCancelCallback = () => {
    this.setState({showEdit: false});
  }

  editSuccessCallback = () => {
    this.setState({showEdit: false});
  }

  removeSuccessCallback = ({documentId}) => {
    this.props.flash("Successfully deleted comment", "success");
  }

  handleLinkClick = (event) => {
    const { comment, router } = this.props;
    event.preventDefault()
    this.props.router.replace({...router.location, hash: "#" + comment._id})
    this.props.scrollIntoView(event);
    return false;
  }

  render() {
    const currentUser = this.props.currentUser;
    const comment = this.props.comment;
    const commentBody = this.props.collapsed ? "" : (
      <div>
        {this.state.showEdit ? this.renderEdit() : this.renderComment()}
        {!comment.deleted && this.renderCommentBottom()}
      </div>
    )
    if (comment) {
      return (
        <div className={
          classNames(
            "comments-item",
            {deleted: comment.deleted && !comment.deletedPublic,
            "public-deleted": comment.deletedPublic}
          )}
        >
          <div className="comments-item-body">
            <div className="comments-item-meta">
              <a className="comments-collapse" onClick={this.props.toggleCollapse}>[<span>{this.props.collapsed ? "+" : "-"}</span>]</a>
              {!comment.deleted && <span>
                <Components.UsersName user={comment.user}/>
              </span>}
              {comment.deleted && <span>[comment deleted] </span>}
              <div className="comments-item-date">
                { this.props.frontPage ?
                  <Link to={Posts.getPageUrl(this.props.post) + "#" + comment._id}>
                    {moment(new Date(comment.postedAt)).fromNow()}
                    <FontIcon className="material-icons comments-item-permalink"> link
                    </FontIcon>
                  </Link>
                :
                <a href={Posts.getPageUrl(this.props.post) + "#" + comment._id} onClick={this.handleLinkClick}>
                  {moment(new Date(comment.postedAt)).fromNow()}
                  <FontIcon className="material-icons comments-item-permalink"> link
                  </FontIcon>
                </a>
                }
              </div>
              <div className="comments-item-vote">
                <Components.Vote collection={Comments} document={this.props.comment} currentUser={currentUser}/>
              </div>
              {this.renderMenu()}
            </div>
            { commentBody }

          </div>
          {this.state.showReply && !this.props.collapsed ? this.renderReply() : null}
        </div>
      )
    } else {
      return null
    }
  }

  renderCommentBottom = () => {
    const comment = this.props.comment;
    const currentUser = this.props.currentUser;
    const blockedReplies = comment.repliesBlockedUntil && new Date(comment.repliesBlockedUntil) > new Date();

    const showReplyButton = (
      !comment.isDeleted &&
      !!this.props.currentUser &&
      (!blockedReplies || Users.canDo(currentUser,'comments.replyOnBlocked.all')) &&
      Users.isAllowedToComment(currentUser, this.props.post)
    )

    return (
      <div className="comments-item-bottom">
        { blockedReplies &&
          <div className="comment-blocked-replies">
            A moderator has deactivated replies on this comment until {moment(new Date(comment.repliesBlockedUntil)).calendar()}
          </div>
        }
        <div>
          { showReplyButton &&
            <a className="comments-item-reply-link" onClick={this.showReply}>
              <FormattedMessage id="comments.reply"/>
            </a>
          }
        </div>
      </div>
    )
  }

  renderMenu = () => {
    const comment = this.props.comment;
    const post = this.props.post || comment.post;
    if (comment && post) {
      return (
        <div className="comments-more-actions-menu">
          <object>
            <IconMenu
              iconButtonElement={<IconButton style={moreActionsMenuButtonStyle}><MoreVertIcon /></IconButton>}
              anchorOrigin={{horizontal: 'right', vertical: 'top'}}
              targetOrigin={{horizontal: 'right', vertical: 'top'}}
              style={moreActionsMenuStyle}
              iconStyle={moreActionsMenuIconStyle}
              useLayerForClickAway={true}
            >
              { this.renderEditMenuItem() }
              { this.renderSubscribeMenuItem() }
              { this.renderReportMenuItem() }
              { this.renderStatsMenuItem() }
              { this.renderDeleteMenuItem() }
              { Users.canModeratePost(this.props.currentUser, post) &&
                post.user && Users.canModeratePost(post.user, post) &&
                <MenuItem
                  className="comment-menu-item-ban-user-submenu"
                  primaryText="Ban User"
                  rightIcon={<ArrowDropRight />}
                  menuItems={[
                    <Components.BanUserFromPostMenuItem
                      comment={comment}
                      post={post}
                      currentUser={this.props.currentUser}
                    />,
                    <Components.BanUserFromAllPostsMenuItem
                      comment={comment}
                      post={post}
                      currentUser={this.props.currentUser}
                    />
                  ]}
                />}
            </IconMenu>
            { this.state.showReport &&
              <Components.ReportForm
                commentId={comment._id}
                postId={comment.postId}
                link={"/posts/" + comment.postId + "/a/" + comment._id}
                userId={this.props.currentUser._id}
                open={true}
              />
            }
            { this.state.showStats &&
              <Dialog title="Comment Stats"
                modal={false}
                actions={<FlatButton label="Close" primary={true} onTouchTap={ this.hideStats }/>}
                open={this.state.showStats}
                onRequestClose={this.hideStats}
              >
                <Components.CommentVotesInfo documentId={comment._id} />
              </Dialog>
            }
          </object>
        </div>
      )
    }
  }

  renderStatsMenuItem = () => {
    if (Users.canDo(this.props.currentUser, "comments.edit.all")) {
      return <MenuItem primaryText="Stats" onTouchTap={this.showStats} />
    }
  }

  renderSubscribeMenuItem = () => {
    return(
      <MenuItem
             className="comment-menu-item-subscribe"
             primaryText="Subscribe"
             disabled={!this.props.currentUser}>
      {this.props.currentUser && <Components.SubscribeTo className="comments-subscribe" document={this.props.comment} />}
      </MenuItem>
    )
  }

  renderReportMenuItem = () => {
    if (Users.canDo(this.props.currentUser, "reports.new")) {
      return (
        <MenuItem
          className="comment-menu-item-report"
          onTouchTap={this.showReport}
          primaryText="Report"
        />
      )
    }
  }

  renderEditMenuItem = () => {
    if (Users.canDo(this.props.currentUser, "comments.edit.all") ||
        Users.owns(this.props.currentUser, this.props.comment)) {
          return (
            <MenuItem
              className="comment-menu-item-edit"
              onTouchTap={this.showEdit}
              primaryText="Edit"
            />
          )
    }
  }

  renderDeleteMenuItem = () =>  {
    if (Users.canModeratePost(this.props.currentUser, this.props.post)) {
      return (
        <Components.DeleteCommentMenuItem
          currentUser={this.props.currentUser}
          comment={this.props.comment}
        />
      )
    }
  }

  renderComment = () =>  {
    const comment = this.props.comment;
    const htmlBody = {__html: comment.htmlBody};
    return (
      <div className="comments-item-text content-body">
        {htmlBody && !comment.deleted && <div className="comment-body" dangerouslySetInnerHTML={htmlBody}></div>}
        {comment.deleted && <div className="comment-body"><Components.CommentDeletedMetadata documentId={comment._id}/></div>}
      </div>
    )
  }

  renderReply = () => {
    const levelClass = (this.props.comment.level + 1) % 2 === 0 ? "comments-node-even" : "comments-node-odd"

    return (
      <div className={classNames("comments-item-reply", levelClass)}>
        <Components.CommentsNewForm
          postId={this.props.comment.postId}
          parentComment={this.props.comment}
          successCallback={this.replySuccessCallback}
          cancelCallback={this.replyCancelCallback}
          type="reply"
        />
      </div>
    )
  }

  renderEdit = () =>
      <Components.CommentsEditForm
        comment={this.props.comment}
        successCallback={this.editSuccessCallback}
        cancelCallback={this.editCancelCallback}
      />
}

registerComponent('CommentsItem', CommentsItem, withRouter, withMessages);
export default CommentsItem;
