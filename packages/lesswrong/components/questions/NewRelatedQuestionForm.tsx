import { Components, registerComponent, getFragment } from '../../lib/vulcan-lib';
import { useMessages } from '../common/withMessages';
import React from 'react';
import { useCurrentUser } from '../common/withUser'
import { Posts } from '../../lib/collections/posts/collection'

const styles = theme => ({
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
      background: "rgba(0,0,0, 0.05)",
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
  refetch: any,
}) => {
  const currentUser = useCurrentUser();
  const { flash } = useMessages();
  const { SubmitToFrontpageCheckbox, PostSubmit } = Components

  const QuestionSubmit = (props) => {
    return <div className={classes.formSubmit}>
      <SubmitToFrontpageCheckbox 
        {...props} 
        label="Hide from frontpage" 
        fieldName="hiddenRelatedQuestion"
        tooltip={<div>
          <div>
            To avoid cluttering the home page with questions (while encouraging people to liberally use the "related question" feature), related questions by default are hidden from the 'Latest Posts' section. 
          </div>
          <br/>
          <div>
            Toggle this off if you'd like to display your question.
          </div>
        </div>}
      />
      <PostSubmit {...props} />
    </div>
  }
  if (!currentUser) return null

  return (
    <div className={classes.root}>
      <Components.WrappedSmartForm
        collection={Posts}
        fields={['title', 'contents', 'question', 'draft', 'submitToFrontpage', 'hiddenRelatedQuestion', 'originalPostRelationSourceId']}
        mutationFragment={getFragment('PostsList')}
        prefilledProps={{
          userId: currentUser._id,
          question: true,
          hiddenRelatedQuestion: true,
          originalPostRelationSourceId: post._id
        }}
        successCallback={(...args) => {
          // This refetches the post data so that the Related Questions list will show the new question.
          refetch()
          flash({ id: 'posts.created_message', properties: { title: post.title }, type: 'success'});
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

