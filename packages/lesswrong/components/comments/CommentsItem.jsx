import { Components, getRawComponent, replaceComponent } from 'meteor/vulcan:core';
import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { withRouter, Link } from 'react-router';
import { FormattedMessage } from 'meteor/vulcan:i18n';
import { Comments } from "meteor/example-forum";
import moment from 'moment';
import Users from 'meteor/vulcan:users';

import MoreVertIcon from 'material-ui/svg-icons/navigation/more-vert';
import { IconMenu, IconButton, MenuItem, FlatButton, Dialog } from 'material-ui';

const paperStyle = {
  padding: '10px',
  backgroundColor: 'transparent',
}

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

  handleDelete = () => {
    this.props.editMutation({
      documentId: this.props.comment._id,
      set: {deleted:true},
      unset: {}
    }).then(()=>console.log('comment deleted')).catch(/* error */);
  }

  handleUndoDelete = () => {
    this.props.editMutation({
      documentId: this.props.comment._id,
      set: {deleted:false},
      unset: {}
    }).then(()=>console.log('comment undo deleted')).catch(/* error */);
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

  // TODO: Make comments collapsible id:18
  // TODO: Create unique comment-links id:14

  render() {
    const currentUser = this.props.currentUser;
    const comment = this.props.comment;
    const params = this.props.router.params;
    const commentLink = "/posts/"+params._id+"/"+params.slug+"/"+comment._id;
    const deletedClass = this.props.comment.deleted ? " deleted" : "";
    const commentBody = this.props.collapsed ? "" : (
      <div>
        {this.state.showEdit ? this.renderEdit() : this.renderComment()}
        {this.renderCommentBottom()}
      </div>
    )

    return (
      <div className={"comments-item" + deletedClass} id={comment._id}>
        <div className="comments-item-body">
          <div className="comments-item-meta">
            <a className="comments-collapse" onClick={this.props.toggleCollapse}>[<span>{this.props.collapsed ? "+" : "-"}</span>]</a>
            <Components.UsersName user={comment.user}/>
            <div className="comments-item-vote">
              <Components.Vote collection={Comments} document={this.props.comment} currentUser={currentUser}/>
            </div>
            <div className="comments-item-date"><Link to={commentLink}>{moment(new Date(comment.postedAt)).fromNow()} </Link></div>
            {this.renderMenu()}
          </div>
          { commentBody }
        </div>
        {this.state.showReply && !this.props.collapsed ? this.renderReply() : null}
      </div>
    )
  }

  renderCommentBottom = () => {
    const comment = this.props.comment;
    const currentUser = this.props.currentUser;
    const blockedReplies = comment.repliesBlockedUntil && new Date(comment.repliesBlockedUntil) > new Date();
    const showReplyButton = !comment.isDeleted && !!this.props.currentUser && (
      !blockedReplies || Users.canDo(currentUser,'comments.replyOnBlocked.all'))

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
          <div className="comments-item-vote">
            <Components.Vote
              collection={Comments}
              document={this.props.comment}
              currentUser={this.props.currentUser}/>
          </div>
        </div>
      </div>
    )
  }

  renderMenu = () => {
    return (
      <div className="comments-more-actions-menu">
        <object>
          <IconMenu
            iconButtonElement={<IconButton style={moreActionsMenuButtonStyle}><MoreVertIcon /></IconButton>}
            anchorOrigin={{horizontal: 'right', vertical: 'top'}}
            targetOrigin={{horizontal: 'right', vertical: 'top'}}
            style={moreActionsMenuStyle}
            iconStyle={moreActionsMenuIconStyle}
          >
            { this.renderEditMenuItem() }
            { this.renderDeleteMenuItem() }
            { this.renderSubscribeMenuItem() }
            { this.renderReportMenuItem() }
            { this.renderStatsMenuItem() }
          </IconMenu>
          { this.state.showReport &&
            <Components.ReportForm
              commentId={this.props.comment._id}
              postId={this.props.comment.postId}
              link={"/posts/" + this.props.comment.postId + "/a/" + this.props.comment._id}
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
              <Components.CommentVotesInfo documentId={this.props.comment._id} />
            </Dialog>
          }
        </object>
      </div>
    )
  }

  renderStatsMenuItem = () => {
    if (Users.canDo(this.props.currentUser, "comments.edit.all")) {
      return <MenuItem primaryText="Stats" onTouchTap={this.showStats} />
    }
  }

  renderSubscribeMenuItem = () => {
    return (
      <MenuItem primaryText="Subscribe">
        <Components.SubscribeTo className="comments-subscribe" document={this.props.comment} />
      </MenuItem>
    )
  }

  renderReportMenuItem = () => {
    if (Users.canDo(this.props.currentUser, "reports.new")) {
      return <MenuItem onTouchTap={this.showReport} primaryText="Report" />
    }
  }

  renderEditMenuItem = () => {
    if (Users.canDo(this.props.currentUser, "comments.edit.all") ||
        Users.owns(this.props.currentUser, this.props.comment)) {
          return <MenuItem onTouchTap={this.showEdit} primaryText="Edit" />
    }
  }

  renderDeleteMenuItem = () =>  {
    if (this.props.comment) {
      let canDelete = Users.canDo(this.props.currentUser,"comments.softRemove.all");
      if (!this.props.comment.deleted && canDelete) {
        return <MenuItem onTouchTap={ this.handleDelete } primaryText="Delete" />
      } else if (this.props.comment.deleted && canDelete) {
        return <MenuItem onTouchTap={ this.handleUndoDelete } primaryText="Undo Delete" />
      }
    }
  }

  renderComment = () =>  {
    let content = this.props.comment.content;
    const htmlBody = {__html: this.props.comment.htmlBody};
    return (
      <div className="comments-item-text content-body">
        {htmlBody && <div className="comment-body" dangerouslySetInnerHTML={htmlBody}></div>}
      </div>
    )
  }

  renderReply = () =>
      <div className="comments-item-reply">
        <Components.CommentsNewForm
          postId={this.props.comment.postId}
          parentComment={this.props.comment}
          successCallback={this.replySuccessCallback}
          cancelCallback={this.replyCancelCallback}
          type="reply"
        />
      </div>

  renderEdit = () =>
      <Components.CommentsEditForm
        comment={this.props.comment}
        successCallback={this.editSuccessCallback}
        cancelCallback={this.editCancelCallback}
      />
}

replaceComponent('CommentsItem', CommentsItem, withRouter);
export default CommentsItem;
