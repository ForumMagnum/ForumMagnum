import { Components, registerComponent, useMulti } from 'meteor/vulcan:core';
import React from 'react';
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

const AnswersList = ({terms, post, classes}) => {
  const { results } = useMulti({
    terms,
    collection: Comments,
    queryName: 'AnswersListQuery',
    fragmentName: 'CommentsList',
    fetchPolicy: 'cache-and-network',
    enableTotal: true,
    ssr: true
  });
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

registerComponent('AnswersList', AnswersList, withStyles(styles, {name: "AnswersList"}));
