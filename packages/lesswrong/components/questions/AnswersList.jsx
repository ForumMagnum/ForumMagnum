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
    marginBottom: theme.spacing.unit*5,
    paddingBottom: theme.spacing.unit*2,
    maxWidth: 650,
    borderBottom: "solid 3px rgba(0,0,0,.87)",
  },
  answerCount: {
    ...theme.typography.postStyle,
    borderTop: "solid 3px rgba(0,0,0,.87)",
    paddingTop: 10,
    maxWidth: 650,
    marginBottom: theme.spacing.unit*2,
    [theme.breakpoints.down('md')]: {
      marginLeft: "auto",
      marginRight: "auto"
    }
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
        { results.length } Answers
      </Typography>
      <div className={classes.answersList}>
        { results.map((comment, i) => {
          return <Answer comment={comment} post={post} key={comment._id} answerCount={results.length} index={i} />
          })
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
