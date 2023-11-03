import React from 'react';
import PropTypes from 'prop-types';
import { Components, registerComponent, getSiteUrl } from '../../lib/vulcan-lib';
import Button from '@material-ui/core/Button';
import classNames from 'classnames';
import { useCurrentUser } from "../common/withUser";
import { useTracking } from "../../lib/analyticsEvents";
import {forumTitleSetting, isEAForum } from "../../lib/instanceSettings";
import { forumSelect } from '../../lib/forumTypeUtils';
import { isFriendlyUI } from '../../themes/forumTheme';

export const styles = (theme: ThemeType): JssStyles => ({
  formButton: {
    fontFamily: theme.typography.commentStyle.fontFamily,
    fontSize: isFriendlyUI ? 14 : 16,
    marginLeft: 5,
    ...(isFriendlyUI ? {
      textTransform: 'none',
    } : {
      paddingBottom: 4,
      fontWeight: 500,
      "&:hover": {
        background: theme.palette.buttons.hoverGrayHighlight,
      }
    })
  },
  secondaryButton: {
    ...(isFriendlyUI ? {
      color: theme.palette.grey[680],
      padding: '8px 12px'
    } : {
      color: theme.palette.text.dim40,
    })
  },
  submitButtons: {
    marginLeft: 'auto'
  },
  submitButton: {
    ...(isFriendlyUI ? {
      backgroundColor: theme.palette.buttons.alwaysPrimary,
      color: theme.palette.text.alwaysWhite,
      boxShadow: 'none',
      marginLeft: 10,
    } : {
      color: theme.palette.secondary.main
    })
  },
  cancelButton: {
  },
  draft: {
  },
  feedback: {
  }
});

export type PostSubmitProps = FormButtonProps & {
  saveDraftLabel?: string,
  feedbackLabel?: string,
  document: PostsPage,
  classes: ClassesType
}

const requestFeedbackKarmaLevel = forumSelect({
  EAForum: 200,
  default: 100,
})

const PostSubmit = ({
  submitLabel = "Submit",
  cancelLabel = "Cancel",
  saveDraftLabel = "Save as Draft",
  feedbackLabel = "Request Feedback",
  cancelCallback, document, collectionName, classes
}: PostSubmitProps, { updateCurrentValues, addToSuccessForm }: any) => {
  const currentUser = useCurrentUser();
  const { captureEvent } = useTracking();
  if (!currentUser) throw Error("must be logged in to post")

  const { LWTooltip } = Components;

  return (
    <React.Fragment>
      {!!cancelCallback &&
        <div className={classes.cancelButton}>
          <Button
            className={classNames("form-cancel", classes.formButton, classes.secondaryButton)}
            onClick={(e) => {
              e.preventDefault();
              cancelCallback(document)
            }}
          >
            {cancelLabel}
          </Button>
        </div>
      }
      <div className={classes.submitButtons}>
        {currentUser.karma >= requestFeedbackKarmaLevel && document.draft!==false && <LWTooltip
          // EA Forum title is Effective Altruism Forum, which is unecessarily long
          title={`Request feedback from the ${isEAForum ? "EA Forum" : forumTitleSetting.get()} team.`}
        >
          <Button type="submit"//treat as draft when draft is null
            className={classNames(classes.formButton, classes.secondaryButton, classes.feedback)}
            onClick={() => {
              captureEvent("feedbackRequestButtonClicked")
              if (!!document.title) {
                updateCurrentValues({draft: true});
                addToSuccessForm((createdPost: DbPost) => {
                  // eslint-disable-next-line
                  window.Intercom(
                    'trackEvent',
                    'requested-feedback',
                    {title: createdPost.title, _id: createdPost._id, url: getSiteUrl() + "posts/" + createdPost._id}
                  );
                });
              }
            }}
          >
            {feedbackLabel}
          </Button>
        </LWTooltip>}
        <Button type="submit"
          className={classNames(classes.formButton, classes.secondaryButton, classes.draft)}
          onClick={() => updateCurrentValues({draft: true})}
        >
          {saveDraftLabel}
        </Button>
        <Button
          type="submit"
          onClick={() => collectionName === "Posts" && updateCurrentValues({draft: false})}
          className={classNames("primary-form-submit-button", classes.formButton, classes.submitButton)}
          {...(isFriendlyUI ? {
            variant: "contained",
            color: "primary",
          } : {})}
        >
          {submitLabel}
        </Button>
      </div>
    </React.Fragment>
  );
}

PostSubmit.propTypes = {
  submitLabel: PropTypes.string,
  cancelLabel: PropTypes.string,
  cancelCallback: PropTypes.func,
  document: PropTypes.object,
  collectionName: PropTypes.string,
  classes: PropTypes.object,
};

PostSubmit.contextTypes = {
  updateCurrentValues: PropTypes.func,
  addToSuccessForm: PropTypes.func,
  addToSubmitForm: PropTypes.func,
}


// HACK: Cast PostSubmit to hide the legacy context arguments, to make the type checking work
const PostSubmitComponent = registerComponent('PostSubmit', (PostSubmit as React.ComponentType<PostSubmitProps>), {styles});

declare global {
  interface ComponentTypes {
    PostSubmit: typeof PostSubmitComponent
  }
}
