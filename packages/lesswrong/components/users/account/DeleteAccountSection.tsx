import React, { useCallback } from 'react';
import { registerComponent } from '@/lib/vulcan-lib/components';
import moment from 'moment';
import { ACCOUNT_DELETION_COOLING_OFF_DAYS } from '@/lib/collections/users/helpers';
import { useDialog } from '@/components/common/withDialog';
import { useFlashErrors } from '@/components/hooks/useFlashErrors';
import DeleteAccountConfirmationModal from "./DeleteAccountConfirmationModal";
import ActionButtonSection from "./ActionButtonSection";
import FormatDate from "../../common/FormatDate";
import { useMutation } from "@apollo/client";
import { gql } from "@/lib/generated/gql-codegen";

const UsersEditUpdateMutation = gql(`
  mutation updateUserDeleteAccountSection($selector: SelectorInput!, $data: UpdateUserDataInput!) {
    updateUser(selector: $selector, data: $data) {
      data {
        ...UsersEdit
      }
    }
  }
`);

const styles = (theme: ThemeType) => ({
  warningButton: {
    border: `1px solid ${theme.palette.error.main} !important`,
    color: theme.palette.error.main
  },
  warningMessage: {
    fontWeight: 600,
    color: theme.palette.error.main
  }
});

const DeleteAccountSection = ({
  user,
  classes,
}: {
  user: UsersEdit,
  classes: ClassesType<typeof styles>,
}) => {
  const [rawUpdateUser, { loading }] = useMutation(UsersEditUpdateMutation);
  const updateUser = useFlashErrors(rawUpdateUser);
  const { openDialog } = useDialog();

  const getWarningMessage = () => {
    if (!user.permanentDeletionRequestedAt) return null;

    const deletionDate = moment(user.permanentDeletionRequestedAt).add(ACCOUNT_DELETION_COOLING_OFF_DAYS, 'days').toDate();
    return (
      <p className={classes.warningMessage}>
        Your account will be permanently deleted{" "}
        {deletionDate > new Date() ? (
          <span>
            in <FormatDate date={deletionDate} tooltip={true} />
          </span>
        ) : (
          <span>within an hour</span>
        )}
      </p>
    );
  }

  const description = (
    <>
      <div>
        Deleting your account will permanently remove your data from the Forum and associated services. You will be
        asked for confirmation before continuing.
      </div>
      {getWarningMessage()}
    </>
  );

  const onClick = useCallback(() => {
    const permanentDeletionRequestedAt = user.permanentDeletionRequestedAt ? null : new Date();
    const deleted = !!permanentDeletionRequestedAt || user.deleted;

    const confirmAction = async () => {
      await updateUser({
        variables: {
          selector: { _id: user._id },
          data: {
            permanentDeletionRequestedAt,
            deleted,
          },
        },
      });
    }

    if (!permanentDeletionRequestedAt) {
      void confirmAction()
    } else {
      openDialog({
        name: 'DeleteAccountConfirmationModal',
        contents: ({onClose}) => <DeleteAccountConfirmationModal
          onClose={onClose}
          confirmAction={confirmAction}
        />
      })
    }
  }, [openDialog, updateUser, user._id, user.deleted, user.permanentDeletionRequestedAt]);

  return (
    <ActionButtonSection
      description={description}
      buttonText={user.permanentDeletionRequestedAt ? "Revoke deletion request" : "Delete account"}
      buttonProps={{ variant: "outlined", className: classes.warningButton }}
      loading={loading}
      onClick={onClick}
    />
  );
};

export default registerComponent('DeleteAccountSection', DeleteAccountSection, { styles });




