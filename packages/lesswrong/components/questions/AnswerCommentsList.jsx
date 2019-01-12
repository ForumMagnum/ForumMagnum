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
  answersList: {
    marginLeft: 34,
    borderTop: `solid 1px ${theme.palette.grey[300]}`,
    [theme.breakpoints.down('md')]: {
      marginLeft: 0
    }
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
    marginLeft: 34,
    marginTop: 16,
    paddingLeft: 12,
    borderTop: `solid 1px ${theme.palette.grey[300]}`
  },
  newComment: {
    marginBottom: 8,
    textAlign: 'right',
    color: theme.palette.grey[600]
  },
  loadMore: {
    color: theme.palette.grey[500],
    textAlign: 'right'
  },
  loadingMore: {
    opacity:.7
  },
  canLoadMore: {
    cursor: "pointer"
  }
})


class AnswerCommentsList extends PureComponent {

  constructor(props) {
    super(props);
    this.state = {
      commenting: false,
      loadedMore: false,
      highlightDate: this.props.lastEvent &&
        this.props.lastEvent.properties &&
        this.props.lastEvent.properties.createdAt &&
        new Date(this.props.lastEvent.properties.createdAt)
        ||
        this.props.post &&
        this.props.post.lastVisitedAt &&
        new Date(this.props.post.lastVisitedAt) ||
        new Date(),
    }
  }

  closeCommentNewForm = () => {
    this.setState({commenting:false})
  }

  loadMoreComments = (event) => {
    event.stopPropagation()
    const { loadMore, totalCount } = this.props
    if (totalCount > 3) {
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
          {!commenting && <Typography variant="body2" onClick={()=>this.setState({commenting: true})} className={classNames(classes.newComment)}>
              <a>Add Comment</a>
            </Typography>}
          { commenting &&
              <div className={classes.editor}>
                <CommentsNewForm
                  postId={post._id}
                  parentComment={parentAnswer}
                  prefilledProps={{
                    af: Comments.defaultToAlignment(currentUser, post),
                    parentAnswerId: parentAnswer._id,
                    parentCommentId: parentAnswer._id,
                  }}
                  successCallback={this.closeCommentNewForm}
                  cancelCallback={this.closeCommentNewForm}
                  type="reply"
                />
              </div>
            }
          <div onClick={this.loadMoreComments}
            className={classNames(
              classes.answersList, {
                [classes.noCommentAnswersList]: noComments,
                [classes.loadingMore]: loadingMore,
                [classes.canLoadMore]: !loadedMore && totalCount > 3
              }
          )}>
            { loadingMore && <Loading /> }
            <CommentsList
              currentUser={currentUser}
              totalComments={totalCount}
              comments={nestedComments}
              highlightDate={highlightDate}
              post={post}
              parentAnswerId={parentAnswer._id}
              postPage
              startThreadCollapsed
            />
          </div>
          {(results && results.length && results.length < totalCount) ?
            <Typography variant="body2" onClick={this.loadMoreComments} className={classes.loadMore}>
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
  parentAnswerId: PropTypes.string,
  loading: PropTypes.bool,
  results: PropTypes.array,
};

const listOptions = {
  collection: Comments,
  queryName: 'AnswersCommentListQuery',
  fragmentName: 'CommentsList',
  enableTotal: true,
}

registerComponent('AnswerCommentsList', AnswerCommentsList, [withList, listOptions], withStyles(styles, {name: "AnswerCommentsList"}), withUser);
