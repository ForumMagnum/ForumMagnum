import { Components, registerComponent } from '../../lib/vulcan-lib';
import React from 'react';
import { useLocation } from '../../lib/routeUtil';
import { isFriendlyUI } from '../../themes/forumTheme';
import { CommentTreeNode } from '../../lib/utils/unflatten';

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
    ...(isFriendlyUI
      ? {
        fontFamily: theme.palette.fonts.sansSerifStack,
      }
      : {}),
  },
  loading: {
    opacity: .5,
  },
})

const AnswersList = ({post, answersTree, classes}: {
  post: PostsList,
  answersTree: CommentTreeNode<CommentsList>[],
  classes: ClassesType,
}) => {
  const location = useLocation();
  const { query } = location;
  const { Answer, SectionTitle, AnswersSorting } = Components

  if (answersTree?.length) {
    return <div className={classes.root}>
      <SectionTitle title={
        <div><span>{ answersTree.length } Answers </span>
        <span className={classes.answersSorting}>sorted by <AnswersSorting post={post}/></span>
      </div>}/>

      <div className={classes.answersList}>
        { answersTree.map((answerNode, i) => {
          return <Answer
            key={answerNode.item._id}
            comment={answerNode.item}
            post={post}
            childComments={answerNode.children}
          />
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
