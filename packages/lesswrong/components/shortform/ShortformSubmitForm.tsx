import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { ForumOptions, forumSelect } from '../../lib/forumTypeUtils';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    paddingLeft: 12,
    paddingRight: 12,
    background: theme.palette.panelBackground.default,
    border: theme.palette.border.commentBorder,
    borderRadius: 3,
    marginBottom: 32,
  }
})

const forumHintText: ForumOptions<string> = {
  LessWrong: "Write your thoughts here! What have you been thinking about\nExploratory, draft-stage, rough, and rambly thoughts are all welcome on Shortform.",
  AlignmentForum: "Write your thoughts here! What have you been thinking about?\nExploratory, draft-stage, rough, and rambly thoughts are all welcome on Shortform.",
  EAForum: "Write your brief or quickly written post here.\nExploratory, draft-stage, rough, and off-the-cuff thoughts are all welcome on Shortform.",
  default: "Write your brief or quickly written post here.\nExploratory, draft-stage, rough, and off-the-cuff thoughts are all welcome on Shortform."
}

const ShortformSubmitForm = ({ successCallback, classes }: {
  successCallback?: any,
  classes: ClassesType,
}) => {
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
          editorHintText: forumSelect(forumHintText)
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

