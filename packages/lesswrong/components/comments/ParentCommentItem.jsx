import { Components, getRawComponent, registerComponent } from 'meteor/vulcan:core';
import React from 'react';
import classNames from 'classnames';
import withErrorBoundary from '../common/withErrorBoundary'
import { withStyles } from '@material-ui/core/styles'

const styles = theme => ({
})

class ParentCommentItem extends getRawComponent('CommentsItem') {
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
    const { comment, post, showTitle, level=1, classes } = this.props;
    const { CommentUserName } = Components;

    if (!comment || !comment.post) {
      return <div className="comments-node recent-comments-node loading">
        <Components.Loading />
      </div>
    }
    
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
          <div>
            <Components.ParentCommentSingle
              post={post}
              currentUser={this.props.currentUser}
              documentId={comment.parentCommentId}
              level={level + 1}
              expanded={true}
              key={comment.parentCommentId}
            />
          </div>
        )}

        <div className="comments-item">
          <div className="comments-item-body">
            <div className="comments-item-meta">
              <Components.ShowParentComment
                comment={comment} nestingLevel={level}
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
              { level === 1 && this.renderMenu() }
            </div>
            {this.renderBodyOrEditor()}
          </div>
        </div>
        {this.state.showReply ? this.renderReply() : null}
      </div>
    );
  }
}

registerComponent('ParentCommentItem', ParentCommentItem,
  withErrorBoundary,
  withStyles(styles, {name:'ParentCommentItem'}));
