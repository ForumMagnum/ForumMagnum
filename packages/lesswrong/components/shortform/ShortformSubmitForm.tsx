import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { forumTypeSetting } from '../../lib/instanceSettings';

const styles = theme => ({
  root: {
    marginLeft: 12,
    marginRight: 12
  }
}) 

const forumHintText = {
  LessWrong: <div>
    <div>Write your thoughts here! What have you been thinking about?</div>
    <div>Exploratory, draft-stage, rough, and rambly thoughts are all welcome on Shortform.</div>
  </div>,
  AlignmentForum: <div>
    <div>Write your thoughts here! What have you been thinking about?</div>
    <div>Exploratory, draft-stage, rough, and rambly thoughts are all welcome on Shortform.</div>
  </div>,
  EAForum: <div>
    <div>Write your brief or quickly written post here.</div>
    <div>Exploratory, draft-stage, rough, and off-the-cuff thoughts are all welcome on Shortform.</div>
  </div>
}

const ShortformSubmitForm = ({ classes, successCallback}) => {
  const { CommentsNewForm } = Components;

  return (
    <div className={classes.root}>
      <CommentsNewForm
        prefilledProps={{
          shortform: true, 
        }}
        successCallback={successCallback}
        type="comment"
        formProps={{
          editorHintText: forumHintText[forumTypeSetting.get()]
        }}
      />
    </div>
  );
}

const ShortformSubmitFormComponent = registerComponent('ShortformSubmitForm', ShortformSubmitForm, {styles});

declare global {
  interface ComponentTypes {
    ShortformSubmitForm: typeof ShortformSubmitFormComponent
  }
}

