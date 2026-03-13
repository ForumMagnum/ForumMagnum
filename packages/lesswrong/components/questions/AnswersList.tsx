import { registerComponent } from '../../lib/vulcan-lib/components';
import React from 'react';
import { useLocation } from '../../lib/routeUtil';
import { CommentTreeNode } from '../../lib/utils/unflatten';
import Answer from "./Answer";
import SectionTitle from "../common/SectionTitle";
import AnswersSorting from "./AnswersSorting";
import { defineStyles } from '@/components/hooks/defineStyles';
import { useStyles } from '@/components/hooks/useStyles';

const styles = defineStyles('AnswersList', (theme: ThemeType) => ({
  root: {
    width: 650 + (32),
    [theme.breakpoints.down('md')]: {
      width: "unset"
    }
  },
  answersList: {
    marginTop: 16,
    marginBottom: 40,
    paddingBottom: 16,
  },
  answersSorting:{
    ...theme.typography.body1,
    color: theme.palette.text.secondary,
    ...(theme.isFriendlyUI
      ? {
        fontFamily: theme.palette.fonts.sansSerifStack,
      }
      : {}),
  },
  loading: {
    opacity: .5,
  },
}))

const AnswersList = ({post, answersTree}: {
  post: PostsList,
  answersTree: CommentTreeNode<CommentsList>[],
}) => {
  const classes = useStyles(styles);
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

export default registerComponent('AnswersList', AnswersList, {styles});


