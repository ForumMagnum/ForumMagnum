import { Components, registerComponent, withList } from 'meteor/vulcan:core';
import React from 'react';
import PropTypes from 'prop-types';
import { Comments } from '../../lib/collections/comments';
import Typography from '@material-ui/core/Typography'
import { withStyles } from '@material-ui/core/styles'
import classNames from 'classnames';

const styles = theme => ({
  answersList: {
    marginTop: theme.spacing.unit*2,
    marginBottom: theme.spacing.unit*2,
  },
  answerCount: {
    ...theme.typography.postStyle,
    borderTop: "solid 3px rgba(0,0,0,.87)",
    paddingTop: 10,
    width: 670,
    margin: "auto",
    marginBottom: theme.spacing.unit*2,
  },
  loading: {
    opacity: .5,
  },
})

const AnswersList = ({results, loading, classes, post}) => {
  const { Answer } = Components

  if (results && results.length) {
    return <div>
      <Typography variant="display1" className={classNames(classes.answerCount, {[classes.loading]: loading})}>
        { results ? results.length : "Loading" } Answers
      </Typography>
      <div className={classes.answersList}>
        { results ? results.map((comment) => {
          return <span key={comment._id} >
            <Answer comment={comment} post={post}/>
          </span>
          })
          : <Components.Loading />
        }
      </div>
    </div>
  } else {
    return null
  }
};

AnswersList.propTypes = {
  classes: PropTypes.object.isRequired,
  post: PropTypes.object.isRequired,
  loading: PropTypes.bool,
  results: PropTypes.array,
};

const listOptions = {
  collection: Comments,
  queryName: 'AnswersListQuery',
  fragmentName: 'CommentsList',
  enableTotal: true,
  ssr: true
}

registerComponent('AnswersList', AnswersList, [withList, listOptions], withStyles(styles, {name: "AnswersList"}));
