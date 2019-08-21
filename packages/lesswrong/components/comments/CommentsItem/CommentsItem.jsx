import { Components, registerComponent, withMessages } from 'meteor/vulcan:core';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Users from 'meteor/vulcan:users';
import classNames from 'classnames';
import { shallowEqual, shallowEqualExcept } from '../../../lib/modules/utils/componentUtils';
import { withStyles } from '@material-ui/core/styles';
import withErrorBoundary from '../../common/withErrorBoundary';
import withUser from '../../common/withUser';

// Shared with ParentCommentItem
export const styles = theme => ({
  root: {
    "&:hover $menu": {
      opacity:1
    }
  },
  body: {
    borderStyle: "none",
    padding: 0,
    ...theme.typography.commentStyle,
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
  blockedReplies: {
    padding: "5px 0",
  },
  replyLink: {
    marginRight: 5,
    display: "inline",
    color: "rgba(0,0,0,.5)",
    "@media print": {
      display: "none",
    },
  },
  collapse: {
    marginRight: 5,
    opacity: 0.8,
    fontSize: "0.8rem",
    lineHeight: "1rem",
    paddingBottom: 4,
    display: "inline-block",
    verticalAlign: "middle",

    "& span": {
      fontFamily: "monospace",
    }
  },
  firstParentComment: {
    // Sorry Oli
    margin: "-2px -13px -2px -12px"
  },
  meta: {
    "& > div": {
      display: "inline-block",
      marginRight: 5,
    },
    
    marginBottom: 8,
    color: "rgba(0,0,0,0.5)",
    paddingTop: ".6em",
  
    "& a:hover, & a:active": {
      textDecoration: "none",
      color: "rgba(0,0,0,0.3) !important",
    },
  },
  bottom: {
    paddingBottom: 5,
    fontSize: 12,
  },
  replyForm: {
    marginTop: 15,
    padding: 10,
    border: "solid 1px rgba(0,0,0,.2)",
  },
  deleted: {
    backgroundColor: "#ffefef",
  }
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
    if(!shallowEqualExcept(this.props, nextProps, ["post", "updateComment"]))
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
    const { refetch } = this.props 
    if (refetch) {
      refetch()
    }
    this.setState({showReply: false});
  }

  setShowEdit = () => {
    this.setState({showEdit: true});
  }

  editCancelCallback = () => {
    this.setState({showEdit: false});
  }

  editSuccessCallback = () => {
    const { refetch } = this.props 
    if (refetch) {
      refetch()
    }
    this.setState({showEdit: false});
  }

  removeSuccessCallback = () => {
    this.props.flash({messageString: "Successfully deleted comment", type: "success"});
  }

  toggleShowParent = () => {
    this.setState({showParent:!this.state.showParent})
  }

  render() {
    const { comment, currentUser, postPage, nestingLevel=1, showPostTitle, classes, post, collapsed, isParentComment, parentCommentId, scrollIntoView } = this.props

    const { ShowParentComment, CommentsItemDate, CommentUserName, CommentShortformIcon } = Components

    if (!comment || !post) {
      return null;
    }
    
    return (
      <div className={
        classNames(
          classes.root,
          "comments-item",
          "recent-comments-node",
          {
            [classes.deleted]: comment.deleted && !comment.deletedPublic,
          },
        )}
      >
        { comment.parentCommentId && this.state.showParent && (
          <div className={classes.firstParentComment}>
            <Components.ParentCommentSingle
              post={post}
              currentUser={currentUser}
              documentId={comment.parentCommentId}
              nestingLevel={nestingLevel - 1}
              truncated={false}
              key={comment.parentCommentId}
            />
          </div>
        )}

        <div className={classes.body}>
          <div className={classes.meta}>
            { !parentCommentId && !comment.parentCommentId && isParentComment &&
              <div className={classes.usernameSpacing}>○</div>
            }
            <CommentShortformIcon comment={comment} post={post} />
            { parentCommentId!=comment.parentCommentId &&
              <ShowParentComment
                comment={comment} nestingLevel={nestingLevel}
                active={this.state.showParent}
                onClick={this.toggleShowParent}
                placeholderIfMissing={isParentComment}
              />
            }
            { (postPage || this.props.collapsed) && <a className={classes.collapse} onClick={this.props.toggleCollapse}>
              [<span>{this.props.collapsed ? "+" : "-"}</span>]
            </a>
            }
            <CommentUserName comment={comment}/>
            <CommentsItemDate
              comment={comment} post={post}
              showPostTitle={showPostTitle}
              scrollIntoView={scrollIntoView}
              scrollOnClick={postPage && !isParentComment}
            />
            <Components.CommentsVote comment={comment} currentUser={currentUser} />
            
            {!isParentComment && this.renderMenu()}
            <span className={classes.outdatedWarning}>
              <Components.CommentOutdatedWarning comment={comment} post={post} />
            </span>
          </div>
          {this.renderBodyOrEditor()}
          {!comment.deleted && !collapsed && this.renderCommentBottom()}
        </div>
        { this.state.showReply && !this.props.collapsed && this.renderReply() }
      </div>
    )
  }
  
  renderMenu = () => {
    const { classes, comment, post } = this.props;
    const { CommentsMenu } = Components;
    return (
      <span className={classes.metaRight}>
        <span className={classes.menu}>
          <CommentsMenu
            comment={comment}
            post={post}
            showEdit={this.setShowEdit}
          />
        </span>
      </span>
    )
  }
  
  renderBodyOrEditor = () => {
    const { comment, truncated, collapsed, postPage } = this.props;
    const { showEdit } = this.state;
    
    if (showEdit) {
      return <Components.CommentsEditForm
        comment={comment}
        successCallback={this.editSuccessCallback}
        cancelCallback={this.editCancelCallback}
      />
    } else {
      return <Components.CommentBody
        truncated={truncated}
        collapsed={collapsed}
        comment={comment}
        postPage={postPage}
      />
    }
  }

  renderCommentBottom = () => {
    const { comment, currentUser, collapsed, classes } = this.props;
    const { MetaInfo } = Components

    if (!collapsed) {
      const blockedReplies = comment.repliesBlockedUntil && new Date(comment.repliesBlockedUntil) > new Date();

      const showReplyButton = (
        !comment.deleted &&
        (!blockedReplies || Users.canDo(currentUser,'comments.replyOnBlocked.all')) &&
        (!currentUser || Users.isAllowedToComment(currentUser, this.props.post))
      )

      return (
        <div className={classes.bottom}>
          { blockedReplies &&
            <div className={classes.blockedReplies}>
              A moderator has deactivated replies on this comment until <Components.CalendarDate date={comment.repliesBlockedUntil}/>
            </div>
          }
          <div>
            { comment.retracted && <MetaInfo>[This comment is no longer endorsed by its author]</MetaInfo>}
            { showReplyButton &&
              <a className={classNames("comments-item-reply-link", classes.replyLink)} onClick={this.showReply}>
                Reply
              </a>
            }
          </div>
        </div>
      )
    }
  }

  renderReply = () => {
    const { post, comment, classes, parentAnswerId, nestingLevel=1 } = this.props
    const levelClass = (nestingLevel + 1) % 2 === 0 ? "comments-node-even" : "comments-node-odd"

    return (
      <div className={classNames(classes.replyForm, levelClass)}>
        <Components.CommentsNewForm
          post={post}
          parentComment={comment}
          successCallback={this.replySuccessCallback}
          cancelCallback={this.replyCancelCallback}
          prefilledProps={{
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
  post: PropTypes.object,
  comment: PropTypes.object.isRequired
}

registerComponent('CommentsItem', CommentsItem,
  withMessages, withUser,
  withStyles(styles, { name: "CommentsItem" }),
  withErrorBoundary
);
export default CommentsItem;
