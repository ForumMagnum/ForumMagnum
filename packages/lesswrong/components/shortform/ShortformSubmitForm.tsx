import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useCurrentUser } from '../common/withUser';
import type {
  CommentCancelCallback,
  CommentSuccessCallback,
} from '../comments/CommentsNewForm';
import { isFriendlyUI } from '../../themes/forumTheme';

const styles = (theme: ThemeType) => ({
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
    margin: isFriendlyUI ? 20 : '16px 20px 16px 0px',
  },
  quickTakesRoot: {
    background: "transparent",
    padding: 0,
    border: "none",
  },
});

const ShortformSubmitForm = ({
  successCallback,
  cancelCallback,
  className,
  defaultExpanded,
  hideCloseButton,
  submitButtonAtBottom,
  classes,
}: {
  successCallback?: CommentSuccessCallback,
  cancelCallback?: CommentCancelCallback,
  prefilledProps?: any,
  noDefaultStyles?: boolean,
  className?: string,
  defaultExpanded?: boolean,
  hideCloseButton?: boolean,
  submitButtonAtBottom?: boolean,
  classes: ClassesType<typeof styles>,
}) => {
  const currentUser = useCurrentUser();
  const {QuickTakesEntry, ForumIcon} = Components;

  return (
    <div className={className}>
      {!hideCloseButton &&
        <div className={classes.close} onClick={cancelCallback}>
          <ForumIcon icon="Close" />
        </div>
      }
      <div className={classes.newQuickTake}>New quick take</div>
      <QuickTakesEntry
        currentUser={currentUser}
        className={classes.quickTakesRoot}
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
