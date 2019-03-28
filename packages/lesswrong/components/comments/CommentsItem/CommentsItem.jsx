import { Components, registerComponent, withMessages } from 'meteor/vulcan:core';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { withRouter, Link } from 'react-router';
import { FormattedMessage } from 'meteor/vulcan:i18n';
import { Posts } from "../../../lib/collections/posts";
import { Comments } from '../../../lib/collections/comments'
import Users from 'meteor/vulcan:users';
import classNames from 'classnames';
import Icon from '@material-ui/core/Icon';
import Tooltip from '@material-ui/core/Tooltip';
import { shallowEqual, shallowEqualExcept } from '../../../lib/modules/utils/componentUtils';
import { withStyles } from '@material-ui/core/styles';
import withErrorBoundary from '../../common/withErrorBoundary'

const styles = theme => ({
  root: {
    "&:hover $menu": {
      opacity:1
    }
  },
  author: {
    ...theme.typography.body2,
    fontWeight: 600,
    marginRight: 10
  },
  authorAnswer: {
    ...theme.typography.body2,
    fontFamily: theme.typography.postStyle.fontFamily,
    fontWeight: 600,
    marginRight: 10,
    '& a, & a:hover': {
      textShadow:"none",
      backgroundImage: "none"
    }
  },
  postTitle: {
    marginRight: 5,
  },
  menu: {
    opacity:.35,
    marginRight:-5
  },
  metaRight: {
    float: "right"
  },
  outdatedWarning: {
    float: "right",
    position: 'relative',
    [theme.breakpoints.down('xs')]: {
      float: "none",
      marginTop: 7,
      display: 'block'
    }
  },
  date: {
    color: "rgba(0,0,0,0.5)",
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
    if ((nextProps.post && nextProps.post.contents && nextProps.post.contents.version) !== (this.props.post && this.props.post.contents && this.props.post.contents.version))
      return true;
    return false;
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

  showEdit = () => {
    this.setState({showEdit: true});
  }

  editCancelCallback = () => {
    this.setState({showEdit: false});
  }

  editSuccessCallback = () => {
    this.setState({showEdit: false});
  }

  removeSuccessCallback = () => {
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
  }

  getTruncationCharCount = () => {
    const { comment, currentUser, postPage } = this.props

    // Do not truncate for users who have disabled it in their user settings. Might want to do someting more elegant here someday.
    if (currentUser && currentUser.noCollapseCommentsPosts && postPage) {
      return 10000000
    }
    if (currentUser && currentUser.noCollapseCommentsFrontpage && !postPage) {
      return 10000000
    }
    const commentIsRecent = comment.postedAt > new Date(new Date().getTime()-(2*24*60*60*1000)); // past 2 days
    return (commentIsRecent || comment.baseScore >= 10) ? 1600 : 800
  }

  render() {
    const { comment, currentUser, postPage, nestingLevel=1, showPostTitle, classes, post, truncated, collapsed, parentAnswerId } = this.props

    const { showEdit } = this.state
    const { CommentsMenu } = Components

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
              "showParent": this.state.showParent,
            },
          )}
        >

          { comment.parentCommentId && this.state.showParent && (
            <div className="recent-comment-parent root">
              <Components.RecentCommentsSingle
                post={post}
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
              {(comment.parentCommentId && (parentAnswerId !== comment.parentCommentId) && (nestingLevel === 1)) &&
                <Tooltip title="Show previous comment">
                  <Icon
                    onClick={this.toggleShowParent}
                    className={classNames("material-icons","recent-comments-show-parent",{active:this.state.showParent})}
                  >
                    subdirectory_arrow_left
                  </Icon>
                </Tooltip>}
              { (postPage || this.props.collapsed) && <a className="comments-collapse" onClick={this.props.toggleCollapse}>
                [<span>{this.props.collapsed ? "+" : "-"}</span>]
              </a>
              }
              { comment.deleted || comment.hideAuthor || !comment.user ?
                ((comment.hideAuthor || !comment.user) ? <span>[deleted]  </span> : <span> [comment deleted]  </span>) :
                  <span>
                  {!comment.answer ? <span className={classes.author}>
                      <Components.UsersName user={comment.user}/>
                    </span>
                    :
                    <span className={classes.authorAnswer}>
                      Answer by <Components.UsersName user={comment.user}/>
                    </span>
                  }
                  </span>
              }
              <div className={comment.answer ? classes.answerDate : classes.date}>
                { !postPage ?
                  <Link to={Posts.getPageUrl(post) + "#" + comment._id}>
                    <Components.FormatDate date={comment.postedAt} format={comment.answer && "MMM DD, YYYY"}/>
                    <Icon className="material-icons comments-item-permalink"> link
                    </Icon>
                    {showPostTitle && post.title && <span className={classes.postTitle}> { post.title }</span>}
                  </Link>
                :
                <a href={Posts.getPageUrl(post) + "#" + comment._id} onClick={this.handleLinkClick}>
                  <Components.FormatDate date={comment.postedAt}/>
                  <Icon className="material-icons comments-item-permalink"> link
                  </Icon>
                  {showPostTitle && post.title && <span className={classes.postTitle}> { post.title }</span>}
                </a>
                }
              </div>
              <Components.CommentsVote comment={comment} currentUser={currentUser} />

              <span className={classes.metaRight}>
                <span className={classes.menu}>
                  <CommentsMenu
                    comment={comment}
                    post={post}
                    showEdit={this.showEdit}
                  />
                </span>
              </span>
              <span className={classes.outdatedWarning}>
                  <Components.CommentOutdatedWarning comment={comment} post={post} />
              </span>
            </div>
            { showEdit ? (
              <Components.CommentsEditForm
                  comment={comment}
                  successCallback={this.editSuccessCallback}
                  cancelCallback={this.editCancelCallback}
                />
            ) : (
              <Components.CommentBody
                truncationCharCount={this.getTruncationCharCount()}
                truncated={truncated}
                collapsed={collapsed}
                comment={comment}
              />
            ) }
            {!comment.deleted && !collapsed && this.renderCommentBottom()}
          </div>
          { this.state.showReply && !this.props.collapsed && this.renderReply() }
        </div>
      )
    } else {
      return null
    }
  }

  renderCommentBottom = () => {
    const { comment, currentUser, truncated, collapsed } = this.props;
    const markdown = (comment.contents && comment.contents.markdown) || ""
    const { MetaInfo } = Components

    if ((!truncated || (markdown.length <= this.getTruncationCharCount())) && !collapsed) {
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
            { comment.retracted && <MetaInfo>[This comment is no longer endorsed by its author]</MetaInfo>}
            { showReplyButton &&
              <a className="comments-item-reply-link" onClick={this.showReply}>
                <FormattedMessage id="comments.reply"/>
              </a>
            }
          </div>
        </div>
      )
    }
  }

  renderReply = () => {
    const { currentUser, post, comment, parentAnswerId, nestingLevel=1 } = this.props
    const levelClass = (nestingLevel + 1) % 2 === 0 ? "comments-node-even" : "comments-node-odd"

    return (
      <div className={classNames("comments-item-reply", levelClass)}>
        <Components.CommentsNewForm
          postId={comment.postId}
          parentComment={comment}
          alignmentForumPost={post.af}
          successCallback={this.replySuccessCallback}
          cancelCallback={this.replyCancelCallback}
          prefilledProps={{
            af:Comments.defaultToAlignment(currentUser, post, comment),
            parentCommentId: comment._id,
            parentAnswerId: parentAnswerId ? parentAnswerId : null
          }}
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
  withErrorBoundary
);
export default CommentsItem;
