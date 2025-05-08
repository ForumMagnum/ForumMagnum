import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import React from 'react';
import withErrorBoundary from '../common/withErrorBoundary';
import * as _ from 'underscore';

const styles = (theme: ThemeType) => ({
  root: {
    width: 650 + (theme.spacing.unit*4),
    marginBottom: 100,
    [theme.breakpoints.down('md')]: {
      width: "unset",
      marginLeft: "auto",
      marginRight: "auto"
    }
  },
  header: {
    ...theme.typography.body2,
    marginTop: theme.spacing.unit*2,
    marginBottom: theme.spacing.unit/2,
    color: theme.palette.grey[700]
  },
  subQuestion: {
    marginBottom: theme.spacing.unit,
  },
  subSubQuestions: {
    paddingLeft: theme.spacing.unit,
    borderLeft: theme.palette.border.slightlyFaint,
  }
})

const RelatedQuestionsListInner = ({ post, classes }: {
  post: PostsDetails,
  classes: ClassesType<typeof styles>,
}) => {
  const { PostsItem, SectionTitle } = Components
  
  const sourcePostRelations = _.filter(post.sourcePostRelations, rel => !!rel.sourcePost)
  const targetPostRelations = _.filter(post.targetPostRelations, rel => (rel.sourcePostId === post._id && !!rel.targetPost))

  const totalRelatedQuestionCount = sourcePostRelations.length + targetPostRelations.length
  
  const showParentLabel = sourcePostRelations.length > 0
  const showSubQuestionLabel = (sourcePostRelations.length > 0) && (targetPostRelations.length > 0)
  
  if (!totalRelatedQuestionCount) return null

  return (
    <div className={classes.root}>

      {(totalRelatedQuestionCount > 0) && <SectionTitle title={`${totalRelatedQuestionCount} Related Questions`} />}
      
      {showParentLabel && <div className={classes.header}>Parent Question{(sourcePostRelations.length > 1) && "s"}</div>}
      {sourcePostRelations.map((rel, i) => rel.sourcePost && 
        <PostsItem
          key={rel._id}
          post={rel.sourcePost}
          index={i}
        />
      )}
      {showSubQuestionLabel && <div className={classes.header}>Sub-Questions</div>}
      {targetPostRelations.map((rel, i) => {
        const parentQuestionId = rel.targetPostId;
        const subQuestionTargetPostRelations = _.filter(post.targetPostRelations, rel => rel.sourcePostId === parentQuestionId);
        const showSubQuestions = subQuestionTargetPostRelations.length >= 1;
        if (!rel.targetPost) return null
        return (
          <div key={rel._id} className={classes.subQuestion} >
            <PostsItem 
              post={rel.targetPost} 
              index={i}
              showPostedAt={false}
              showIcons={false}
              showBottomBorder={!showSubQuestions}
              defaultToShowComments={true}
            />
            {showSubQuestions && <div className={classes.subSubQuestions}>
              {subQuestionTargetPostRelations.map((rel, i) => rel.targetPost && <PostsItem 
                key={rel._id}
                post={rel.targetPost} 
                showPostedAt={false}
                showIcons={false}
                defaultToShowComments={true}
                index={i}
              />)}
            </div>}
          </div>
        )
      })}
    </div>
  )
}

export const RelatedQuestionsList = registerComponent('RelatedQuestionsList', RelatedQuestionsListInner, {
  styles,
  hocs: [withErrorBoundary]
});

declare global {
  interface ComponentTypes {
    RelatedQuestionsList: typeof RelatedQuestionsList
  }
}

