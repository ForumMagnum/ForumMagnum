import { Components, registerComponent, withMessages } from 'meteor/vulcan:core';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { withRouter, Link } from '../../../lib/reactRouterWrapper.js';
import { FormattedMessage } from 'meteor/vulcan:i18n';
import { Posts } from "../../../lib/collections/posts";
import Users from 'meteor/vulcan:users';
import classNames from 'classnames';
import Icon from '@material-ui/core/Icon';
import { shallowEqual, shallowEqualExcept } from '../../../lib/modules/utils/componentUtils';
import { withStyles } from '@material-ui/core/styles';
import withErrorBoundary from '../../common/withErrorBoundary';
import withUser from '../../common/withUser';

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

  render() {
    const { comment, currentUser, postPage, nestingLevel=1, showPostTitle, classes, post, truncated, collapsed } = this.props

    const { showEdit } = this.state
    const { CommentsMenu, ShowParentComment } = Components

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
              <ShowParentComment comment={comment} nestingLevel={nestingLevel} onClick={this.toggleShowParent}/>
              { (postPage || this.props.collapsed) && <a className={classes.collapse} onClick={this.props.toggleCollapse}>
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
                truncated={truncated}
                collapsed={collapsed}
                comment={comment}
                postPage={postPage}
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
        <div className="comments-item-bottom">
          { blockedReplies &&
            <div className={classes.blockedReplies}>
              A moderator has deactivated replies on this comment until <Components.CalendarDate date={comment.repliesBlockedUntil}/>
            </div>
          }
          <div>
            { comment.retracted && <MetaInfo>[This comment is no longer endorsed by its author]</MetaInfo>}
            { showReplyButton &&
              <a className={classNames("comments-item-reply-link", classes.replyLink)} onClick={this.showReply}>
                <FormattedMessage id="comments.reply"/>
              </a>
            }
          </div>
        </div>
      )
    }
  }

  renderReply = () => {
    const { post, comment, parentAnswerId, nestingLevel=1 } = this.props
    const levelClass = (nestingLevel + 1) % 2 === 0 ? "comments-node-even" : "comments-node-odd"

    return (
      <div className={classNames("comments-item-reply", levelClass)}>
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
  post: PropTypes.object.isRequired,
  comment: PropTypes.object.isRequired
}

registerComponent('CommentsItem', CommentsItem,
  withRouter, withMessages, withUser,
  withStyles(styles, { name: "CommentsItem" }),
  withErrorBoundary
);
export default CommentsItem;
