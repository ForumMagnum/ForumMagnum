import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useMulti } from '../../lib/crud/withMulti';
import React from 'react';
import { Comments } from '../../lib/collections/comments';

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

const AnswersList = ({terms, post, classes}: {
  terms: any,
  post: PostsList,
  classes: ClassesType,
}) => {
  const { results } = useMulti({
    terms,
    collection: Comments,
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

const AnswersListComponent = registerComponent('AnswersList', AnswersList, {
  styles,
  areEqual: {
    terms: "deep",
  }
});

declare global {
  interface ComponentTypes {
    AnswersList: typeof AnswersListComponent
  }
}

