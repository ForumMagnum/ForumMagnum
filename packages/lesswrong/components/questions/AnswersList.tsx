import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useMulti } from '../../lib/crud/withMulti';
import React from 'react';
import { useLocation } from '../../lib/routeUtil';

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
  answersSorting:{
    ...theme.typography.body1,
    color: theme.palette.text.secondary,
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
  const location = useLocation();
  const { query } = location;
  const sortBy = query.answersSorting || "top";
  const { results } = useMulti({
    terms: {
      view: "questionAnswers",
      postId: post._id,
      limit: MAX_ANSWERS_QUERIED,
      sortBy
    },
    collectionName: "Comments",
    fragmentName: 'CommentsList',
    fetchPolicy: 'cache-and-network',
    enableTotal: true,
  });
  const { Answer, SectionTitle, AnswersSorting } = Components

  if (results && results.length) {
    return <div className={classes.root}>
      <SectionTitle title={
        <div><span>{ results.length } Answers </span>
        <span className={classes.answersSorting}>sorted by <AnswersSorting post={post}/></span>
      </div>}/>

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

