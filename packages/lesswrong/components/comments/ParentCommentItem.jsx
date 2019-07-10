import { Components, getRawComponent, registerComponent } from 'meteor/vulcan:core';
import React from 'react';
import classNames from 'classnames';
import withErrorBoundary from '../common/withErrorBoundary'
import { withStyles } from '@material-ui/core/styles'
import { styles } from './CommentsItem/CommentsItem.jsx';

class ParentCommentItem extends getRawComponent('CommentsItem') {
  render() {
    const { comment, post, collapsed, showTitle, nestingLevel=1, classes } = this.props;
    const { CommentUserName } = Components;

    if (!comment || !comment.post) {
      return <div className="comments-node recent-comments-node loading">
        <Components.Loading />
      </div>
    }
    
    return (
      <div className="comments-item">
        { comment.parentCommentId && this.state.showParent && (
          <div>
            <Components.ParentCommentSingle
              post={post}
              currentUser={this.props.currentUser}
              documentId={comment.parentCommentId}
              nestingLevel={nestingLevel + 1}
              expanded={true}
              key={comment.parentCommentId}
            />
          </div>
        )}
        <div className={classes.body}>
          <div className={classes.meta}>
            <Components.ShowParentComment
              comment={comment} nestingLevel={nestingLevel}
              active={this.state.showParent}
              onClick={this.toggleShowParent}
              placeholderIfMissing={true}
            />
            <CommentUserName comment={comment}/>
            {comment.post &&
              <Components.CommentsItemDate
                comment={comment} post={comment.post}
                showPostTitle={showTitle}
                scrollOnClick={false}
              />
            }
            <Components.CommentsVote comment={comment} currentUser={this.props.currentUser} />
            { nestingLevel === 1 && this.renderMenu() }
          </div>
          {this.renderBodyOrEditor()}
        </div>
        {this.state.showReply ? this.renderReply() : null}
      </div>
    );
  }
}

registerComponent('ParentCommentItem', ParentCommentItem,
  withErrorBoundary,
  withStyles(styles, {name:'ParentCommentItem'}));
