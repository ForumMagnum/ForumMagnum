import React, { useCallback } from 'react';
import { Components, registerComponent } from '@/lib/vulcan-lib/components.tsx';
import { useUpdate } from '@/lib/crud/withUpdate';
import moment from 'moment';
import { ACCOUNT_DELETION_COOLING_OFF_DAYS } from '@/lib/collections/users/helpers';
import { useDialog } from '@/components/common/withDialog';
import { useFlashErrors } from '@/components/hooks/useFlashErrors';
import { ActionButtonSection } from "@/components/users/account/ActionButtonSection";
import FormatDate from "@/components/common/FormatDate";

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
  const { mutate: rawUpdateUser, loading } = useUpdate({
    collectionName: "Users",
    fragmentName: 'UsersEdit',
  });
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
        selector: { _id: user._id },
        data: {
          permanentDeletionRequestedAt,
          deleted,
        },
      });
    }

    if (!permanentDeletionRequestedAt) {
      void confirmAction()
    } else {
      openDialog({
        componentName: 'DeleteAccountConfirmationModal',
        componentProps: {
          confirmAction
        }
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

const DeleteAccountSectionComponent = registerComponent('DeleteAccountSection', DeleteAccountSection, { styles });

declare global {
  interface ComponentTypes {
    DeleteAccountSection: typeof DeleteAccountSectionComponent
  }
}

export default DeleteAccountSectionComponent;

export {
  DeleteAccountSectionComponent as DeleteAccountSection
}
