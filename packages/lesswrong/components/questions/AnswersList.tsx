import { registerComponent } from '../../lib/vulcan-lib/components';
import React from 'react';
import { useLocation } from '../../lib/routeUtil';
import { isFriendlyUI } from '../../themes/forumTheme';
import { CommentTreeNode } from '../../lib/utils/unflatten';
import { Answer } from "./Answer";
import { SectionTitle } from "../common/SectionTitle";
import { AnswersSorting } from "./AnswersSorting";

const styles = (theme: ThemeType) => ({
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

const AnswersListInner = ({post, answersTree, classes}: {
  post: PostsList,
  answersTree: CommentTreeNode<CommentsList>[],
  classes: ClassesType<typeof styles>,
}) => {
  const location = useLocation();
  const { query } = location;
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

export const AnswersList = registerComponent('AnswersList', AnswersListInner, {styles});


