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
    marginTop: theme.spacing.unit*2,
    marginLeft: 34,
    borderTop: `solid 1px ${theme.palette.grey[300]}`
  },
  newComment: {
    marginTop: theme.spacing.unit*2,
    marginLeft: theme.spacing.unit,
    color: theme.palette.grey[500]
  },
  noComments: {
    position: "relative",
    textAlign: "right",
    top:-theme.spacing.unit*8
  },
})


class AnswerCommentsList extends PureComponent {

  constructor(props) {
    super(props);
    this.state = {
      commenting: false,
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

  render() {
    const { currentUser, results, loading, classes, totalCount, post, parentAnswerId } = this.props
    const { CommentsList, Loading, CommentsNewForm } = Components

    const { commenting, highlightDate } = this.state

    // const loadingMore = networkStatus === 2;
    if (loading || !results) {
      return <Loading/>
    } else {
      const nestedComments = unflattenComments(results);
      return (
        <div>
          <div className={classes.answersList}>
            <CommentsList
              currentUser={currentUser}
              totalComments={totalCount}
              comments={nestedComments}
              highlightDate={highlightDate}
              post={post}
              parentAnswerId={parentAnswerId}
              postPage
              startThreadCollapsed
            />
            { commenting &&
              <div className={classes.editor}>
                <CommentsNewForm
                  postId={post._id}
                  prefilledProps={{
                    af: Comments.defaultToAlignment(currentUser, post),
                    parentAnswerId: parentAnswerId}}
                  successCallback={this.closeCommentNewForm}
                  cancelCallback={this.closeCommentNewForm}
                  type="reply"
                  parentAnswerId={parentAnswerId}
                />
              </div>
            }
          </div>
          {!commenting && <Typography variant="body2" onClick={()=>this.setState({commenting: true})} className={classNames(classes.newComment, {[classes.noComments]: (!results || !results.length) && !commenting})}>
            <a>Add Comment</a>
          </Typography>}
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
