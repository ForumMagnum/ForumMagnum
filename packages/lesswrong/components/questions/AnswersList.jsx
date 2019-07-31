import { Components, registerComponent, withList } from 'meteor/vulcan:core';
import React from 'react';
import PropTypes from 'prop-types';
import { Comments } from '../../lib/collections/comments';
import { withStyles } from '@material-ui/core/styles'

const styles = theme => ({
  root: {
    width: 650 + (theme.spacing.unit*4),
    [theme.breakpoints.down('md')]: {
      width: "unset"
    }
  },
  answersList: {
    marginTop: theme.spacing.unit*2,
    marginBottom: theme.spacing.unit*5,
    paddingBottom: theme.spacing.unit*2,
  },
  answerCount: {
    ...theme.typography.postStyle,
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

const AnswersList = ({results, classes, post}) => {
  const { Answer, SectionTitle } = Components

  if (results && results.length) {
    return <div className={classes.root}>
      <SectionTitle title={<span>{ results.length } Answers</span>}/>

      <div className={classes.answersList}>
        { results.map((comment, i) => {
          return <Answer comment={comment} post={post} key={comment._id} />
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
  fetchPolicy: 'cache-and-network',
  enableTotal: true,
  ssr: true
}

registerComponent('AnswersList', AnswersList, [withList, listOptions], withStyles(styles, {name: "AnswersList"}));
