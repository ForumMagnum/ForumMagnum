import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useMulti } from '../../lib/crud/withMulti';
import React from 'react';

const styles = (theme: ThemeType): JssStyles => ({
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

const MAX_ANSWERS_QUERIED = 100

const AnswersList = ({post, classes}: {
  post: PostsList,
  classes: ClassesType,
}) => {
  const { results } = useMulti({
    terms: {
      view: "questionAnswers",
      postId: post._id,
      limit: MAX_ANSWERS_QUERIED
    },
    collectionName: "Comments",
    fragmentName: 'CommentsList',
    fetchPolicy: 'cache-and-network',
    enableTotal: true,
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

const AnswersListComponent = registerComponent('AnswersList', AnswersList, {styles});

declare global {
  interface ComponentTypes {
    AnswersList: typeof AnswersListComponent
  }
}

