import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { ForumOptions, forumSelect } from '../../lib/forumTypeUtils';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    paddingLeft: 12,
    paddingRight: 12,
    background: "white",
    border: `solid 1px ${theme.palette.commentBorderGrey}`,
    borderRadius: 3,
    marginBottom: 32,
  }
})

const forumHintText: ForumOptions<JSX.Element> = {
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
  </div>,
  default: <div>
    <div>Write your brief or quickly written post here.</div>
    <div>Exploratory, draft-stage, rough, and off-the-cuff thoughts are all welcome on Shortform.</div>
  </div>
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

