import { Components, registerComponent, getFragment, withMessages } from 'meteor/vulcan:core';
import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import withUser from '../common/withUser'
import { Posts } from '../../lib/collections/posts/collection.js'

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

const NewRelatedQuestionForm = (props) => {
  const { post, classes, flash, currentUser, refetch } = props
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

NewRelatedQuestionForm.propTypes = {
  classes: PropTypes.object.isRequired,
  post: PropTypes.object.isRequired,
};

registerComponent('NewRelatedQuestionForm', NewRelatedQuestionForm, withMessages, withUser, withStyles(styles, {name:"NewRelatedQuestionForm"}));