import type { TypedFormApi } from '@/components/tanstack-form-components/BaseAppForm.tsx';
import type { EditablePost, PostSubmitMeta } from '@/lib/collections/posts/helpers.ts';
import { forumTitleSetting, isLW, isLWorAF, requestFeedbackKarmaLevelSetting } from '@/lib/instanceSettings.ts';
import Button from '@/lib/vendor/@material-ui/core/src/Button';
import classNames from 'classnames';
import React from 'react';
import { useTracking } from "../../lib/analyticsEvents";
import { getSiteUrl } from "../../lib/vulcan-lib/utils";
import LWTooltip from "../common/LWTooltip";
import { useCurrentUser } from "../common/withUser";
import { defineStyles, useStyles } from '../hooks/useStyles.tsx';

export const styles = defineStyles('PostSubmit', (theme: ThemeType) => ({
  formButton: {
    fontFamily: theme.typography.commentStyle.fontFamily,
    fontSize: 16,
    marginLeft: 5,
    ...({
          paddingBottom: 4,
          fontWeight: 500,
          "&:hover": {
            background: theme.palette.buttons.hoverGrayHighlight,
          }
        })
  },
  secondaryButton: {
    ...({
            color: theme.palette.text.dim40,
          })
  },
  submitButtons: {
    marginLeft: 'auto'
  },
  submitButton: {
    ...({
            color: theme.palette.secondary.main
          })
  },
  cancelButton: {
  },
  draft: {
  },
  feedback: {
  }
}));

export type PostSubmitProps = {
  formApi: TypedFormApi<EditablePost, PostSubmitMeta>,
  disabled: boolean;
  submitLabel?: string,
  cancelLabel?: string,
  saveDraftLabel?: string,
  feedbackLabel?: string,
  cancelCallback?: (document: EditablePost) => void,
}

export const PostSubmit = ({
  formApi,
  disabled,
  submitLabel = "Submit",
  cancelLabel = "Cancel",
  saveDraftLabel = "Save as draft",
  feedbackLabel = "Request Feedback",
  cancelCallback,
}: PostSubmitProps) => {
  const classes = useStyles(styles);
  const currentUser = useCurrentUser();
  const { captureEvent } = useTracking();
  if (!currentUser) throw Error("must be logged in to post");
  const document = formApi.state.values;

  const submitWithConfirmation = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (confirm('Warning!  This will publish your dialogue and make it visible to other users.')) {
      formApi.setFieldValue('draft', false);
      await formApi.handleSubmit();
    }
  };

  const submitWithoutConfirmation = () => formApi.setFieldValue('draft', false);

  const requireConfirmation = isLW() && !!document.debate;

  const onSubmitClick = requireConfirmation ? submitWithConfirmation : submitWithoutConfirmation;
  const requestFeedbackKarmaLevel = requestFeedbackKarmaLevelSetting.get()
  // EA Forum title is Effective Altruism Forum, which is unecessarily long
  const eaOrOtherFeedbackTitle = `the ${forumTitleSetting.get()} team`
  const feedbackTitle = `Request feedback from ${isLWorAF() ? 'our editor' : eaOrOtherFeedbackTitle}`

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
        {requestFeedbackKarmaLevel !== null && currentUser.karma >= requestFeedbackKarmaLevel && document.draft!==false && <LWTooltip
          title={feedbackTitle}
        >
          <Button type="submit"
            className={classNames(classes.formButton, classes.secondaryButton, classes.feedback)}
            disabled={disabled}
            onClick={async () => {
              captureEvent("feedbackRequestButtonClicked")
              if (!!document.title) {
                formApi.setFieldValue('draft', true);
                await formApi.handleSubmit({
                  successCallback: (createdPost: PostsEditMutationFragment) => {
                    const intercomProps = {
                      title: createdPost.title,
                      _id: createdPost._id,
                      url: getSiteUrl() + "posts/" + createdPost._id
                    };

                    // eslint-disable-next-line
                    window.Intercom(
                      'trackEvent',
                      'requested-feedback',
                      intercomProps
                    );
                  },
                  // The redirect here is both undesirable and might interfere with Intercom displaying the message prompt
                  skipRedirect: true,
                });
              }
            }}
          >
            {feedbackLabel}
          </Button>
        </LWTooltip>}
        <Button type="submit"
          className={classNames(classes.formButton, classes.secondaryButton, classes.draft)}
          onClick={() => formApi.setFieldValue('draft', true)}
          disabled={disabled}
        >
          {saveDraftLabel}
        </Button>
        <Button
          type="submit"
          onClick={onSubmitClick}
          disabled={disabled}
          className={classNames("primary-form-submit-button", classes.formButton, classes.submitButton)}
          {...({})}
        >
          {submitLabel}
        </Button>
      </div>
    </React.Fragment>
  );
}
