import React, { PureComponent } from 'react';
import { Components, registerComponent } from 'meteor/vulcan:core';
import withUser from '../common/withUser';
import { unflattenComments, addGapIndicators } from '../../lib/modules/utils/unflatten';
import withRecordPostView from '../common/withRecordPostView';
import { withStyles } from '@material-ui/core/styles';
import withErrorBoundary from '../common/withErrorBoundary';

const styles = theme => ({
  showChildren: {
    padding: 4,
    paddingLeft: 12,
    ...theme.typography.body1,
    color: theme.palette.lwTertiary.main,
    display: "block",
    fontSize: 14,
  },
})

class CommentWithReplies extends PureComponent {
  state = { markedAsVisitedAt: null, maxChildren: 3 }

  markAsRead = async () => {
    const { comment, post, recordPostView } = this.props
    this.setState({markedAsVisitedAt: new Date()});
    recordPostView({post: post ? post : comment.post})
  }

  render () {
    const { classes, comment, refetch } = this.props
    const { CommentsNode } = Components
    const { markedAsVisitedAt, maxChildren } = this.state

    if (!comment || !comment.post)
      return null;

    const lastCommentId = comment.latestChildren[0]?._id

    const renderedChildren = comment.latestChildren.slice(0, maxChildren)
    const extraChildrenCount = (comment.latestChildren.length > renderedChildren.length) && (comment.latestChildren.length - renderedChildren.length)

    let nestedComments = unflattenComments(renderedChildren)
    if (extraChildrenCount > 0) {
      nestedComments = addGapIndicators(nestedComments)
    }

    const lastVisitedAt = markedAsVisitedAt || comment.post.lastVisitedAt

    const showExtraChildrenButton = (extraChildrenCount>0) ? 
      <a className={classes.showChildren} onClick={()=>this.setState({maxChildren: 500})}>
        Showing 3 of {comment.latestChildren.length } replies (Click to show all)
      </a> : null

    return <div>
        <CommentsNode
          noHash
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
          refetch={refetch}
          showExtraChildrenButton={showExtraChildrenButton}
        />
      </div>
  }
}

registerComponent('CommentWithReplies', CommentWithReplies, withUser, withRecordPostView, withStyles(styles, {name:"CommentWithReplies"}), withErrorBoundary);
