import React, { PureComponent } from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import withUser from '../common/withUser';
import { unflattenComments, addGapIndicators } from '../../lib/utils/unflatten';
import withRecordPostView from '../common/withRecordPostView';
import withErrorBoundary from '../common/withErrorBoundary';

const styles = (theme: ThemeType): JssStyles => ({
  showChildren: {
    padding: 4,
    paddingLeft: 12,
    ...theme.typography.body2,
    color: theme.palette.lwTertiary.main,
    display: "block",
    fontSize: 14,
  },
})

interface ExternalProps {
  comment: CommentWithRepliesFragment,
  post: PostsBase,
  refetch: any,
  showTitle?: boolean,
  expandByDefault?: boolean
}
interface CommentWithRepliesProps extends ExternalProps, WithUserProps, WithStylesProps {
  recordPostView: any,
}
interface CommentWithRepliesState {
  markedAsVisitedAt: Date|null,
  maxChildren: number,
}

class CommentWithReplies extends PureComponent<CommentWithRepliesProps,CommentWithRepliesState> {
  state: CommentWithRepliesState = { markedAsVisitedAt: null, maxChildren: 3 }

  markAsRead = async () => {
    const { post, recordPostView } = this.props
    this.setState({markedAsVisitedAt: new Date()});
    recordPostView({post})
  }

  render () {
    const { classes, comment, refetch, post, showTitle=true, expandByDefault } = this.props
    const { CommentsNode } = Components
    const { markedAsVisitedAt, maxChildren } = this.state

    if (!comment || !post)
      return null;

    const lastCommentId = comment.latestChildren[0]?._id

    const renderedChildren = comment.latestChildren.slice(0, maxChildren)
    const extraChildrenCount = (comment.latestChildren.length > renderedChildren.length) && (comment.latestChildren.length - renderedChildren.length)

    let nestedComments = unflattenComments(renderedChildren)
    if (extraChildrenCount > 0) {
      nestedComments = addGapIndicators(nestedComments)
    }

    const lastVisitedAt = markedAsVisitedAt || post.lastVisitedAt

    const showExtraChildrenButton = (extraChildrenCount>0) ? 
      <a className={classes.showChildren} onClick={()=>this.setState({maxChildren: 500})}>
        Showing 3 of {comment.latestChildren.length } replies (Click to show all)
      </a> : null

    return <div>
        <CommentsNode
          noHash
          startThreadTruncated={true}
          showPostTitle={showTitle}
          nestingLevel={1}
          lastCommentId={lastCommentId}
          comment={comment}
          markAsRead={this.markAsRead}
          highlightDate={lastVisitedAt}
          childComments={nestedComments}
          key={comment._id}
          post={post}
          condensed
          shortform
          refetch={refetch}
          expandByDefault={expandByDefault}
          showExtraChildrenButton={showExtraChildrenButton}
        />
      </div>
  }
}

const CommentWithRepliesComponent = registerComponent<ExternalProps>(
  'CommentWithReplies', CommentWithReplies, {
    styles,
    hocs: [withUser, withRecordPostView, withErrorBoundary]
  }
);

declare global {
  interface ComponentTypes {
    CommentWithReplies: typeof CommentWithRepliesComponent,
  }
}

