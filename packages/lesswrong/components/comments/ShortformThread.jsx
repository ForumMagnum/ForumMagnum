import React, { PureComponent } from 'react';
import { Components, registerComponent } from 'meteor/vulcan:core';
import withUser from '../common/withUser';
import { unflattenComments } from '../../lib/modules/utils/unflatten';
import withRecordPostView from '../common/withRecordPostView';

class ShortformThread extends PureComponent {
  state = { markedAsVisitedAt: null }

  markAsRead = async () => {
    const { comment, recordPostView } = this.props
    this.setState({markedAsVisitedAt: new Date()});
    recordPostView({...this.props, document: comment.post})
  }

  render () {
    const { comment } = this.props
    const { CommentsNode } = Components
    const { markedAsVisitedAt } = this.state

    const lastCommentId = comment.latestChildren[0]?._id
    const nestedComments = unflattenComments(comment.latestChildren)
    const lastVisitedAt = markedAsVisitedAt || comment.post.lastVisitedAt

    return <CommentsNode
        startThreadTruncated={true}
        showPostTitle
        startCollapsed
        nestingLevel={1}
        lastCommentId={lastCommentId}
        comment={comment}
        markAsRead={this.markAsRead}
        highlightDate={lastVisitedAt}
        //eslint-disable-next-line react/no-children-prop
        children={nestedComments}
        key={comment._id}
        post={comment.post}
        condensed
        shortform
      />
  }
}

registerComponent('ShortformThread', ShortformThread, withUser, withRecordPostView);
