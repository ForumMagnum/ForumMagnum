import { Components, registerComponent, withList } from 'meteor/vulcan:core';
import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { Comments } from '../../lib/collections/comments';
import { withStyles } from '@material-ui/core/styles'
import { unflattenComments } from "../../lib/modules/utils/unflatten";
import withUser from '../common/withUser';
import classNames from 'classnames';
import Typography from '@material-ui/core/Typography';

const styles = theme => ({
  commentsList: {
    marginLeft: -theme.spacing.unit*1.5,
    marginRight: -theme.spacing.unit*1.5,
  },
  noComments: {
    position: "relative",
    textAlign: "right",
    top:-theme.spacing.unit*8
  },
  noCommentAnswersList: {
    borderTop: 'transparent'
  },
  editor: {
    marginLeft: theme.spacing.unit*4,
    marginTop: theme.spacing.unit*2,
    paddingLeft: theme.spacing.unit*1.5,
    paddingBottom: theme.spacing.unit*1.5,
    borderTop: `solid 1px ${theme.palette.grey[300]}`
  },
  newComment: {
    padding: theme.spacing.unit*2.5,
    textAlign: 'right',
    color: theme.palette.grey[600]
  },
  loadMore: {
    color: theme.palette.primary.main,
    textAlign: 'right'
  },
  loadingMore: {
    opacity:.7
  },
  canLoadMore: {
    cursor: "pointer"
  }
})

export const ABRIDGE_COMMENT_COUNT = 500;

class AnswerCommentsList extends PureComponent {

  constructor(props) {
    super(props);

    const { lastEvent, post } = this.props;

    this.state = {
      commenting: false,
      loadedMore: false,
      highlightDate:
        (lastEvent && lastEvent.properties && lastEvent.properties.createdAt
          && new Date(lastEvent.properties.createdAt))
        || (post && post.lastVisitedAt
          && new Date(post.lastVisitedAt))
        || new Date(),
    }
  }

  closeCommentNewForm = () => {
    this.setState({commenting:false})
  }

  loadMoreComments = (event) => {
    event.stopPropagation()
    const { loadMore, totalCount } = this.props
    if (totalCount > ABRIDGE_COMMENT_COUNT) {
      this.setState({loadedMore: true})
      loadMore({limit: 10000})
    }
  }

  render() {
    const { currentUser, results, loading, loadingMore, classes, totalCount, post, parentAnswer } = this.props
    const { CommentsList, Loading, CommentsNewForm } = Components
    const { commenting, highlightDate, loadedMore } = this.state
    const noComments = (!results || !results.length) && !commenting

    // const loadingMore = networkStatus === 2;
    if (loading || !results) {
      return <Loading/>
    } else {
      const nestedComments = unflattenComments(results);
      return (
        <div>
          {!commenting && <Typography variant="body1" onClick={()=>this.setState({commenting: true})} className={classNames(classes.newComment)}>
              <a>Add Comment</a>
            </Typography>}
          { commenting &&
              <div className={classes.editor}>
                <CommentsNewForm
                  post={post}
                  parentComment={parentAnswer}
                  prefilledProps={{
                    parentAnswerId: parentAnswer._id,
                  }}
                  successCallback={this.closeCommentNewForm}
                  cancelCallback={this.closeCommentNewForm}
                  type="reply"
                />
              </div>
            }
          <div onClick={this.loadMoreComments}
            className={classNames(
              classes.commentsList, {
                [classes.noCommentAnswersList]: noComments,
                [classes.loadingMore]: loadingMore,
                [classes.canLoadMore]: !loadedMore && totalCount > ABRIDGE_COMMENT_COUNT
              }
          )}>
            { loadingMore && <Loading /> }
            <CommentsList
              currentUser={currentUser}
              totalComments={totalCount}
              comments={nestedComments}
              highlightDate={highlightDate}
              post={post}
              parentCommentId={parentAnswer._id}
              parentAnswerId={parentAnswer._id}
              defaultNestingLevel={2}
              postPage
              startThreadTruncated
            />
          </div>
          {(results && results.length && results.length < totalCount) ?
            <Typography variant="body1" onClick={this.loadMoreComments} className={classes.loadMore}>
              <a>Showing {results.length}/{totalCount} comments. Click to load All.</a>
            </Typography> : null}
        </div>
      );
    }
  }
}

AnswerCommentsList.propTypes = {
  classes: PropTypes.object.isRequired,
  post: PropTypes.object.isRequired,
  parentAnswer: PropTypes.object,
  loading: PropTypes.bool,
  results: PropTypes.array,
};

const listOptions = {
  collection: Comments,
  queryName: 'AnswersCommentListQuery',
  fragmentName: 'CommentsList',
  fetchPolicy: 'cache-and-network',
  enableTotal: true,
}

registerComponent('AnswerCommentsList', AnswerCommentsList, [withList, listOptions], withStyles(styles, {name: "AnswerCommentsList"}), withUser);
