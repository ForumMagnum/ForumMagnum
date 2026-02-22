import { MuiTextField } from '@/components/form-components/MuiTextField';
import { FormUserMultiselect } from '@/components/form-components/UserMultiselect';
import { useFormErrors } from '@/components/tanstack-form-components/BaseAppForm';
import { getUpdatedFieldValues } from '@/components/tanstack-form-components/helpers';
import { submitButtonStyles } from '@/components/tanstack-form-components/TanStackSubmit';
import { DialogContent } from "@/components/widgets/DialogContent";
import { DialogTitle } from "@/components/widgets/DialogTitle";
import { gql } from "@/lib/generated/gql-codegen";
import { isLWorAF } from '@/lib/instanceSettings';
import Button from '@/lib/vendor/@material-ui/core/src/Button';
import { userIsAdmin, userIsAdminOrMod } from '@/lib/vulcan-users/permissions';
import { useMutation } from "@apollo/client/react";
import { useForm } from '@tanstack/react-form';
import classNames from 'classnames';
import { preferredHeadingCase } from '../../themes/forumTheme';
import LWDialog from "../common/LWDialog";
import { useCurrentUser } from '../common/withUser';
import FormComponentCheckbox from "../form-components/FormComponentCheckbox";
import { defineStyles, useStyles } from '../hooks/useStyles';

const ConversationsListUpdateMutation = gql(`
  mutation updateConversationConversationTitleEditForm($selector: SelectorInput!, $data: UpdateConversationDataInput!) {
    updateConversation(selector: $selector, data: $data) {
      data {
        ...ConversationsList
      }
    }
  }
`);

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
  const currentUser = useCurrentUser();

  const [mutate] = useMutation(ConversationsListUpdateMutation);

  const { setCaughtError, displayedErrorComponent } = useFormErrors();

  const form = useForm({
    defaultValues: {
      ...conversation,
      participantIds: conversation.participantIds ?? [],
      af: conversation.af ?? null,
      moderator: conversation.moderator ?? null,
      archived: (currentUser && conversation.archivedByIds?.includes(currentUser._id)) ?? null,
    },
    onSubmit: async ({ value, formApi }) => {
      const { archived, ...updatedFields } = getUpdatedFieldValues(formApi);
      const updateData = {
        ...updatedFields,
        archivedByIds: archived
          // use conversation.archivedByIds; updatedFields won't contain it since it's not directly in the form
          // and `getUpdatedFieldValues` only returns fields which have been "dirtied" by being changed in the form
          ? [...(conversation.archivedByIds ?? []), currentUser!._id]
          : (conversation.archivedByIds ?? []).filter(id => id !== currentUser!._id),
      }

      try {
        await mutate({
          variables: {
            selector: { _id: conversation._id },
            data: updateData
          }
        });
      } catch (error) {
        setCaughtError(error);
      }

      onClose?.();
    },
  });

  return <LWDialog open onClose={onClose}>
    <DialogTitle>{preferredHeadingCase("Conversation Options")}</DialogTitle>
    <DialogContent>
      <form className="vulcan-form" onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        void form.handleSubmit();
      }}>
        {displayedErrorComponent}
        <div className={classes.fieldWrapper}>
          <form.Field name="title">
            {(field) => (
              <MuiTextField
                field={field}
                label={"Conversation Title"}
              />
            )}
          </form.Field>
        </div>

        <div className={classes.fieldWrapper}>
          <form.Field name="participantIds">
            {(field) => (
              <FormUserMultiselect
                field={field}
                label="Participants"
              />
            )}
          </form.Field>
        </div>

        {isLWorAF() && userIsAdmin(currentUser) && <div className={classes.fieldWrapper}>
          <form.Field name="af">
            {(field) => (
              <FormComponentCheckbox
                field={field}
                label="Af"
              />
            )}
          </form.Field>
        </div>}

        {userIsAdminOrMod(currentUser) && <div className={classes.fieldWrapper}>
          <form.Field name="moderator">
            {(field) => (
              <FormComponentCheckbox
                field={field}
                label="Moderator"
              />
            )}
          </form.Field>
        </div>}

        {userIsAdminOrMod(currentUser) && <div className={classes.fieldWrapper}>
          <form.Field name="archived">
            {(field) => (
              <FormComponentCheckbox
                field={field}
                label="Archived"
              />
            )}
          </form.Field>
        </div>}

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
  </LWDialog>
}

export default ConversationTitleEditForm;


