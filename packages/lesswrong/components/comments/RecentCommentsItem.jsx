import { Components, getRawComponent, registerComponent } from 'meteor/vulcan:core';
import React from 'react';
import { Posts } from '../../lib/collections/posts';
import { Link } from 'react-router';
import Icon from '@material-ui/core/Icon';
import classNames from 'classnames';
import withErrorBoundary from '../common/withErrorBoundary'
import { withStyles } from '@material-ui/core/styles'

const styles = theme => ({
  author: {
    ...theme.typography.body2,
    fontWeight: 600,
    marginRight: 10
  },
  authorAnswer: {
    fontFamily: theme.typography.postStyle.fontFamily
  }
})

class RecentCommentsItem extends getRawComponent('CommentsItem') {
  constructor(props) {
    super(props);
    this.state = {
      showReply: false,
      showEdit: false,
      expanded: false,
      showParent: false
    };
  }

  toggleShowParent = () => {
    this.setState({showParent:!this.state.showParent})
  }

  render() {
    const { comment, showTitle, level=1, truncated, collapsed, classes } = this.props;
    const { showEdit } = this.state

    if (comment && comment.post) {
      return (
        <div
          className={classNames(
            'comments-node',
            'recent-comments-node',
            {
              "comments-node-root" : level === 1,
              "comments-node-even" : level % 2 === 0,
              "comments-node-odd"  : level % 2 != 0,
              "showParent": this.state.showParent,
            }
          )}>
          { comment.parentCommentId && this.state.showParent && (
            <div className="recent-comment-parent">
              <Components.RecentCommentsSingle
                currentUser={this.props.currentUser}
                documentId={comment.parentCommentId}
                level={level + 1}
                expanded={true}
                key={comment.parentCommentId}
              />
            </div>
          )}

          <div className="comments-item">
            <div className="comments-item-body recent-comments-item-body ">
              <div className="comments-item-meta recent-comments-item-meta">
                { comment.parentCommentId ? (
                    <Icon
                      onClick={this.toggleShowParent}
                      className={classNames("material-icons","recent-comments-show-parent",{active:this.state.showParent})}
                    >
                      subdirectory_arrow_left
                    </Icon>
                  ) : level != 1 && <div className="recent-comment-username-spacing">○</div>
                }
                <span className={classNames(classes.author, {[classes.authorAnswer]:comment.answer})}>
                  {comment.answer && "Answer by "}<Components.UsersName user={comment.user}/>
                </span>
                { comment.post && (
                  <Link to={Posts.getPageUrl(comment.post) + "#" + comment._id}>
                    <div className="comments-item-origin">
                      <div className="comments-item-date">
                        <Components.FormatDate date={comment.postedAt}/>
                        <Icon className="material-icons comments-item-permalink"> link </Icon>
                      </div>
                      { showTitle && comment.post.title}
                    </div>
                  </Link>
                )}
                <Components.CommentsVote comment={comment} currentUser={this.props.currentUser} />
                { level === 1 && this.renderMenu() }
              </div>
              { showEdit ?
                <Components.CommentsEditForm
                  comment={this.props.comment}
                  successCallback={this.editSuccessCallback}
                  cancelCallback={this.editCancelCallback}
                />
                :
                <Components.CommentBody
                  truncated={truncated}
                  collapsed={collapsed}
                  comment={comment}
                />
              }
            </div>
          </div>
          {this.state.showReply ? this.renderReply() : null}
        </div>
      )
    } else {
      return <div className="comments-node recent-comments-node loading">
        <Components.Loading />
      </div>
    }
  }
}

registerComponent('RecentCommentsItem', RecentCommentsItem, withErrorBoundary, withStyles(styles, {name:'RecentCommentsItem'}));
