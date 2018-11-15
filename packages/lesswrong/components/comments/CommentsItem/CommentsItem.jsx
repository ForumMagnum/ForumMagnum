import { Components, getRawComponent, registerComponent, withMessages } from 'meteor/vulcan:core';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { withRouter, Link } from 'react-router';
import { FormattedMessage } from 'meteor/vulcan:i18n';
import { Posts } from "../../../lib/collections/posts";
import { Comments } from '../../../lib/collections/comments'
import Users from 'meteor/vulcan:users';
import classNames from 'classnames';
import Icon from '@material-ui/core/Icon';
import ArrowRight from '@material-ui/icons/ArrowRight';
import MenuItem from 'material-ui/MenuItem';
import { shallowEqual, shallowEqualExcept } from '../../../lib/modules/utils/componentUtils';
import { withStyles } from '@material-ui/core/styles';
import { commentBodyStyles } from '../../../themes/stylePiping'
import withErrorBoundary from '../../common/withErrorBoundary'
import withDialog from '../../common/withDialog'

const styles = theme => ({
  root: {
    "&:hover $menu": {
      opacity:1
    }
  },
  commentStyling: {
    ...commentBodyStyles(theme)
  },
  author: {
    ...theme.typography.commentStyle,
    ...theme.typography.body2,
    fontWeight: 600,
  },
  postTitle: {
    marginRight: 5,
  },
  menu: {
    float:"right",
    opacity:.35,
    marginRight:-5
  },
})

class CommentsItem extends Component {
  constructor(props) {
    super(props);
    this.state = {
      showReply: false,
      showEdit: false,
      showParent: false
    };
  }

  shouldComponentUpdate(nextProps, nextState) {
    if(!shallowEqual(this.state, nextState))
      return true;
    if(!shallowEqualExcept(this.props, nextProps, ["post", "editMutation"]))
      return true;
    return false;
  }

  showReport = (event) => {
    const { openDialog, comment, currentUser } = this.props;
    openDialog({
      componentName: "ReportForm",
      componentProps: {
        commentId: comment._id,
        postId: comment.postId,
        link: "/posts/" + comment.postId + "/a/" + comment._id,
        userId: currentUser._id,
      }
    });
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
    this.props.flash({messageString: "Successfully deleted comment", type: "success"});
  }

  toggleShowParent = () => {
    this.setState({showParent:!this.state.showParent})
  }

  handleLinkClick = (event) => {
    const { comment, router } = this.props;
    event.preventDefault()
    this.props.router.replace({...router.location, hash: "#" + comment._id})
    this.props.scrollIntoView(event);
    return false;
  }

  render() {
    const { comment, currentUser, postPage, nestingLevel=1, showPostTitle, classes, post, truncated, collapsed } = this.props

    const { showEdit } = this.state

    if (comment && post) {
      return (
        <div className={
          classNames(
            classes.root,
            "comments-item",
            "recent-comments-node",
            {
              deleted: comment.deleted && !comment.deletedPublic,
              "public-deleted": comment.deletedPublic,
              "showParent": this.state.showParent
            },
          )}
        >

          { comment.parentCommentId && this.state.showParent && (
            <div className="recent-comment-parent root">
              <Components.RecentCommentsSingle
                currentUser={currentUser}
                documentId={comment.parentCommentId}
                level={nestingLevel + 1}
                truncated={false}
                key={comment.parentCommentId}
              />
            </div>
          )}

          <div className="comments-item-body">
            <div className="comments-item-meta">
              {(comment.parentCommentId && (nestingLevel === 1)) &&
                <Icon
                  onClick={this.toggleShowParent}
                  className={classNames("material-icons","recent-comments-show-parent",{active:this.state.showParent})}
                >
                  subdirectory_arrow_left
                </Icon>}
              { postPage && <a className="comments-collapse" onClick={this.props.toggleCollapse}>
                [<span>{this.props.collapsed ? "+" : "-"}</span>]
              </a>
              }
              { comment.deleted || comment.hideAuthor || !comment.user ?
                ((comment.hideAuthor || !comment.user) ? <span>[deleted]  </span> : <span> [comment deleted]  </span>) :
                <span className={classes.author}> <Components.UsersName user={comment.user}/> </span>
              }
              <div className="comments-item-date">
                { !postPage ?
                  <Link to={Posts.getPageUrl(post) + "#" + comment._id}>
                    <Components.FromNowDate date={comment.postedAt}/>
                    <Icon className="material-icons comments-item-permalink"> link
                    </Icon>
                    {showPostTitle && post && post.title && <span className={classes.postTitle}> { post.title }</span>}
                  </Link>
                :
                <a href={Posts.getPageUrl(post) + "#" + comment._id} onClick={this.handleLinkClick}>
                  <Components.FromNowDate date={comment.postedAt}/>
                  <Icon className="material-icons comments-item-permalink"> link
                  </Icon>
                  {showPostTitle && post && post.title && <span className={classes.postTitle}> { post.title }</span>}
                </a>
                }
              </div>
              <Components.CommentsVote comment={comment} currentUser={currentUser} />
              {this.renderMenu()}
            </div>
            { showEdit ? (
              <Components.CommentsEditForm
                  comment={this.props.comment}
                  successCallback={this.editSuccessCallback}
                  cancelCallback={this.editCancelCallback}
                />
            ) : (
              <Components.CommentBody
                truncated={truncated}
                collapsed={collapsed}
                comment={comment}
              />
            ) }

            {!comment.deleted && this.renderCommentBottom()}
          </div>
          { this.state.showReply && !this.props.collapsed && this.renderReply() }
        </div>
      )
    } else {
      return null
    }
  }

  renderCommentBottom = () => {
    const { comment, currentUser } = this.props;
    const blockedReplies = comment.repliesBlockedUntil && new Date(comment.repliesBlockedUntil) > new Date();

    const showReplyButton = (
      !comment.isDeleted &&
      !!currentUser &&
      (!blockedReplies || Users.canDo(currentUser,'comments.replyOnBlocked.all')) &&
      Users.isAllowedToComment(currentUser, this.props.post)
    )

    return (
      <div className="comments-item-bottom">
        { blockedReplies &&
          <div className="comment-blocked-replies">
            A moderator has deactivated replies on this comment until <Components.CalendarDate date={comment.repliesBlockedUntil}/>
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
    const { comment, currentUser, classes } = this.props;
    const post = this.props.post || comment.post;
    if (comment && post) {
      return (
        <span className={classes.menu}>
          <Components.CommentsMenu>
            { this.renderSubscribeMenuItem() }
            { this.renderEditMenuItem() }
            { this.renderReportMenuItem() }
            { this.renderDeleteMenuItem() }
            { this.renderMoveToAlignmentMenuItem() }
            { this.renderSuggestForAlignmentMenuItem() }
            { Users.canModeratePost(currentUser, post) &&
              post.user && Users.canModeratePost(post.user, post) &&
              <MenuItem
                className="comment-menu-item-ban-user-submenu"
                primaryText="Ban User"
                rightIcon={<ArrowRight />}
                menuItems={[
                  <Components.BanUserFromPostMenuItem
                    key='banUserFromPost'
                    comment={comment}
                    post={post}
                    currentUser={currentUser}
                  />,
                  <Components.BanUserFromAllPostsMenuItem
                    key='banUserFromAllPosts'
                    comment={comment}
                    post={post}
                    currentUser={currentUser}
                  />
                ]}
              />}
            </Components.CommentsMenu>
        </span>
      )
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
          onClick={this.showReport}
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
              onClick={this.showEdit}
              primaryText="Edit"
            />
          )
    }
  }

  renderMoveToAlignmentMenuItem = () =>  {
    const { currentUser, comment, post } = this.props
    if (post.af && Users.canDo(currentUser, 'comments.alignment.move.all')) {
      return (
        <Components.MoveToAlignmentMenuItem
          currentUser={currentUser}
          comment={comment}
        />
      )
    }
  }

  renderSuggestForAlignmentMenuItem = () =>  {
    const { currentUser, comment, post } = this.props
    if (post.af && !comment.af && Users.canDo(currentUser, 'comments.alignment.suggest')) {
      return (
        <Components.SuggestAlignmentMenuItem
          currentUser={currentUser}
          comment={comment}
          post={post}
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

  renderReply = () => {
    const levelClass = ((this.props.nestingLevel || 1) + 1) % 2 === 0 ? "comments-node-even" : "comments-node-odd"

    const { currentUser, post, comment } = this.props

    return (
      <div className={classNames("comments-item-reply", levelClass)}>
        <Components.CommentsNewForm
          postId={comment.postId}
          parentComment={comment}
          successCallback={this.replySuccessCallback}
          cancelCallback={this.replyCancelCallback}
          prefilledProps={{af:Comments.defaultToAlignment(currentUser, post, comment)}}
          type="reply"
        />
      </div>
    )
  }
}

CommentsItem.propTypes = {
  currentUser: PropTypes.object,
  post: PropTypes.object.isRequired,
  comment: PropTypes.object.isRequired
}

registerComponent('CommentsItem', CommentsItem,
  withRouter, withMessages,
  withStyles(styles, { name: "CommentsItem" }),
  withDialog,
  withErrorBoundary
);
export default CommentsItem;
