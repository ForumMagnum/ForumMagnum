import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { ForumOptions, forumSelect } from '../../lib/forumTypeUtils';
import classNames from 'classnames';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    background: theme.palette.panelBackground.default,
    border: theme.palette.border.commentBorder,
    borderRadius: 3,
    marginBottom: 32,
  }
})

const forumHintText: ForumOptions<string> = {
  LessWrong: "Write your thoughts here! What have you been thinking about?\nExploratory, draft-stage, rough, and rambly thoughts are all welcome on Shortform.",
  AlignmentForum: "Write your thoughts here! What have you been thinking about?\nExploratory, draft-stage, rough, and rambly thoughts are all welcome on Shortform.",
  EAForum: "Write your brief or quickly written post here.\nExploratory, draft-stage, rough, and off-the-cuff thoughts are all welcome on Shortform.",
  default: "Write your brief or quickly written post here.\nExploratory, draft-stage, rough, and off-the-cuff thoughts are all welcome on Shortform."
}

const ShortformSubmitForm = ({
  successCallback,
  cancelCallback,
  prefilledProps,
  noDefaultStyles,
  className,
  classes,
}: {
  successCallback?: (comment: CommentsList, otherArgs: any) => (void | Promise<void>),
  cancelCallback?: any,
  prefilledProps?: any,
  noDefaultStyles?: boolean,
  className?: string,
  classes: ClassesType,
}) => {
  const { CommentsNewForm } = Components;

  return (
    <div className={classNames(className, {[classes.root]: !noDefaultStyles})}>
      <CommentsNewForm
        prefilledProps={{
          ...prefilledProps,
          shortform: true,
        }}
        successCallback={successCallback}
        cancelCallback={cancelCallback}
        // Put in "reply" to make the cancel button appear
        type={cancelCallback ? "reply" : "comment"}
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
