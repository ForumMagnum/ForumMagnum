import React, { useCallback } from 'react';
import { Components, registerComponent } from '@/lib/vulcan-lib';
import { useUpdate } from '@/lib/crud/withUpdate';
import type { UpdateUserWrapper } from './UsersAccountManagement';
import moment from 'moment';
import { ACCOUNT_DELETION_COOLING_OFF_DAYS } from '@/lib/collections/users/helpers';
import { useDialog } from '@/components/common/withDialog';

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
  updateUserWrapper,
  classes,
}: {
  user: UsersEdit,
  updateUserWrapper: UpdateUserWrapper,
  classes: ClassesType<typeof styles>,
}) => {
  const { ActionButtonSection, FormatDate } = Components;
  const { mutate: updateUser, loading } = useUpdate({
    collectionName: "Users",
    fragmentName: 'UsersEdit',
  });
  const { openDialog } = useDialog();

  const getWarningMessage = () => {
    if (!user.permanentDeletionRequestedAt) return null;

    const deletionDate = moment(user.permanentDeletionRequestedAt).add(ACCOUNT_DELETION_COOLING_OFF_DAYS, 'days').toDate();
    return <p className={classes.warningMessage}>
        Your account will be permanently deleted in <FormatDate date={deletionDate} tooltip />
      </p>;
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
      await updateUserWrapper({
        updateUser,
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
  }, [openDialog, updateUser, updateUserWrapper, user.deleted, user.permanentDeletionRequestedAt]);

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
