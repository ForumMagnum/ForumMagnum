import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { ForumOptions } from '../../lib/forumTypeUtils';
import { useCurrentUser } from '../common/withUser';
import type {
  CommentCancelCallback,
  CommentSuccessCallback,
} from '../comments/CommentsNewForm';
import { isFriendlyUI } from '../../themes/forumTheme';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    background: theme.palette.panelBackground.default,
    border: theme.palette.border.commentBorder,
    borderRadius: 3,
    marginBottom: 32,
  },
  close: {
    position: "absolute",
    right: 20,
    cursor: "pointer",
    "& svg": {
      color: theme.palette.grey[600],
      width: 20,
    },
  },
  newQuickTake: {
    fontFamily: theme.palette.fonts.sansSerifStack,
    fontWeight: isFriendlyUI ? 700 : 500,
    fontSize: 20,
    color: theme.palette.grey[1000],
    margin: 20,
  },
  quickTakesRoot: {
    background: "transparent",
    padding: 0,
    border: "none",
  },
  quickTakesEditor: {
    background: "transparent",
    padding: "10px 20px",
  },
  quickTakesTags: {
    padding: "0 20px",
  },
  quickTakesButton: {
    marginTop: 20,
    padding: 20,
    borderTop: `1px solid ${theme.palette.grey[300]}`,
  },
});

const ShortformSubmitForm = ({
  successCallback,
  cancelCallback,
  prefilledProps,
  noDefaultStyles,
  className,
  defaultExpanded,
  submitButtonAtBottom,
  classes,
}: {
  successCallback?: CommentSuccessCallback,
  cancelCallback?: CommentCancelCallback,
  prefilledProps?: any,
  noDefaultStyles?: boolean,
  className?: string,
  defaultExpanded?: boolean,
  submitButtonAtBottom?: boolean,
  classes: ClassesType,
}) => {
  const currentUser = useCurrentUser();
  const {QuickTakesEntry, ForumIcon} = Components;

  return (
    <div className={className}>
      <div className={classes.close} onClick={cancelCallback}>
        <ForumIcon icon="Close" />
      </div>
      <div className={classes.newQuickTake}>New quick take</div>
      <QuickTakesEntry
        currentUser={currentUser}
        className={classes.quickTakesRoot}
        editorClassName={classes.quickTakesEditor}
        tagsClassName={classes.quickTakesTags}
        buttonClassName={classes.quickTakesButton}
        successCallback={successCallback}
        cancelCallback={cancelCallback}
        defaultExpanded={isFriendlyUI || defaultExpanded}
        defaultFocus
        submitButtonAtBottom={isFriendlyUI || submitButtonAtBottom}
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
