import { Components, registerComponent, getFragment } from '../../lib/vulcan-lib';
import { useMessages } from '../common/withMessages';
import React from 'react';
import { useCurrentUser } from '../common/withUser'
import { Posts } from '../../lib/collections/posts/collection'
import type { SubmitToFrontpageCheckboxProps } from '../posts/SubmitToFrontpageCheckbox';
import type { PostSubmitProps } from '../posts/PostSubmit';

const styles = (theme: ThemeType): JssStyles => ({
  answersForm: {
    maxWidth:650,
    paddingBottom: theme.spacing.unit*4,
    [theme.breakpoints.down('md')]: {
      marginLeft: "auto",
      marginRight: "auto"
    }
  },
  formButton: {
    paddingBottom: "2px",
    fontSize: "16px",
    marginLeft: "5px",
    "&:hover": {
      background: theme.palette.buttons.hoverGrayHighlight,
    },
    color: theme.palette.secondary.main,
    float: "right"
  },
  formSubmit: {
    display: "flex",
    flexWrap: "wrap",
  }
})

const NewRelatedQuestionForm = ({ post, classes, refetch }: {
  post: PostsBase,
  classes: ClassesType,
  refetch: ()=>void,
}) => {
  const currentUser = useCurrentUser();
  const { flash } = useMessages();
  const { SubmitToFrontpageCheckbox, PostSubmit } = Components

  const QuestionSubmit = (props: SubmitToFrontpageCheckboxProps & PostSubmitProps) => {
    return <div className={classes.formSubmit}>
      <SubmitToFrontpageCheckbox 
        {...props} 
        label="Hide from frontpage" 
        fieldName="hiddenRelatedQuestion"
        tooltip={<div>
          <div>
            Hide this question from the home page
          </div>
          <div><em>(useful if you have lots of related questions and want to avoid spamming)</em></div>
        </div>}
      />
      <PostSubmit {...props} />
    </div>
  }
  if (!currentUser) return null

  return (
    <div className={classes.root}>
      <Components.WrappedSmartForm
        collectionName="Posts"
        fields={['title', 'contents', 'question', 'draft', 'submitToFrontpage', 'hiddenRelatedQuestion', 'originalPostRelationSourceId']}
        mutationFragment={getFragment('PostsList')}
        prefilledProps={{
          userId: currentUser._id,
          question: true,
          hiddenRelatedQuestion: false,
          originalPostRelationSourceId: post._id
        }}
        successCallback={() => {
          // This refetches the post data so that the Related Questions list will show the new question.
          refetch()
          flash({ messageString: "Post created.", type: 'success'});
        }}
        formComponents={{
          FormSubmit: QuestionSubmit,
        }}
      />
    </div>
  )
};

const NewRelatedQuestionFormComponent = registerComponent('NewRelatedQuestionForm', NewRelatedQuestionForm, {styles});

declare global {
  interface ComponentTypes {
    NewRelatedQuestionForm: typeof NewRelatedQuestionFormComponent
  }
}
