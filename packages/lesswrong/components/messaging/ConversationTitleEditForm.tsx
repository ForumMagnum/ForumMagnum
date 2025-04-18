import React from 'react';
import DialogContent from '@/lib/vendor/@material-ui/core/src/DialogContent';
import DialogTitle from '@/lib/vendor/@material-ui/core/src/DialogTitle';
import { isFriendlyUI, preferredHeadingCase } from '../../themes/forumTheme';
import { Components, registerComponent } from "../../lib/vulcan-lib/components";
import { useUpdate } from '@/lib/crud/withUpdate';
import { useForm } from '@tanstack/react-form';
import classNames from 'classnames';
import { defineStyles, useStyles } from '../hooks/useStyles';
import { TanStackCheckbox } from '../tanstack-form-components/TanStackCheckbox';
import { TanStackMuiTextField } from '../tanstack-form-components/TanStackMuiTextField';
import { submitButtonStyles } from '../tanstack-form-components/TanStackSubmit';
import { TanStackUserMultiselect } from '../tanstack-form-components/TanStackUserMultiSelect';
import Button from '@/lib/vendor/@material-ui/core/src/Button';
import { isLWorAF } from '@/lib/instanceSettings';

const formStyles = defineStyles('ConversationTitleEditForm', (theme: ThemeType) => ({
  fieldWrapper: {
    marginTop: theme.spacing.unit * 2,
    marginBottom: theme.spacing.unit * 2,
  },
  submitButton: submitButtonStyles(theme),
}));

/**
 * Form for editing the title of a private messages conversation and also for
 * adding additional participants.
 */
const ConversationTitleEditForm = ({ onClose, conversation }: {
  onClose?: () => void,
  conversation: UpdateConversationDataInput & { _id: string },
}) => {
  const classes = useStyles(formStyles);
  const { Error404 } = Components;

  const formType = conversation ? 'edit' : 'new';

  const { mutate } = useUpdate({
    collectionName: 'Conversations',
    fragmentName: 'ConversationsList',
  });

  const form = useForm({
    defaultValues: {
      ...conversation,
    },
    onSubmit: async ({ value }) => {
      const { title, participantIds, af, moderator } = value;
      const updateData = { title, participantIds, af, moderator };

      await mutate({
        selector: { _id: conversation._id },
        data: updateData,
      });

      onClose?.();
    },
  });

  if (formType === 'edit' && !conversation) {
    return <Error404 />;
  }

  return <Components.LWDialog open onClose={onClose}>
    <DialogTitle>{preferredHeadingCase("Conversation Options")}</DialogTitle>
    <DialogContent>
      <form className="vulcan-form" onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        void form.handleSubmit();
      }}>
        <div className={classes.fieldWrapper}>
          <form.Field name="title">
            {(field) => (
              <TanStackMuiTextField
                field={field}
                label={isFriendlyUI ? "Conversation title (visible to all)" : "Conversation Title"}
              />
            )}
          </form.Field>
        </div>

        <div className={classes.fieldWrapper}>
          <form.Field name="participantIds">
            {(field) => (
              <TanStackUserMultiselect
                field={field}
                label="Participants"
              />
            )}
          </form.Field>
        </div>

        {isLWorAF && <div className={classes.fieldWrapper}>
          <form.Field name="af">
            {(field) => (
              <TanStackCheckbox
                field={field}
                label="Af"
              />
            )}
          </form.Field>
        </div>}

        <div className={classes.fieldWrapper}>
          <form.Field name="moderator">
            {(field) => (
              <TanStackCheckbox
                field={field}
                label="Moderator"
              />
            )}
          </form.Field>
        </div>

        <div className="form-submit">
          <form.Subscribe selector={(s) => [s.canSubmit, s.isSubmitting]}>
            {([canSubmit, isSubmitting]) => (
              <Button
                type="submit"
                disabled={!canSubmit || isSubmitting}
                className={classNames("primary-form-submit-button", classes.submitButton)}
              >
                Submit
              </Button>
            )}
          </form.Subscribe>
        </div>
      </form>
    </DialogContent>
  </Components.LWDialog>
}

const ConversationTitleEditFormComponent = registerComponent('ConversationTitleEditForm', ConversationTitleEditForm);

declare global {
  interface ComponentTypes {
    ConversationTitleEditForm: typeof ConversationTitleEditFormComponent
  }
}
