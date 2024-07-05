import { Components, registerComponent } from '@/lib/vulcan-lib';
import React from 'react';
import type { UpdateUserWrapper } from './UsersAccountManagement';
import { useUpdate } from '@/lib/crud/withUpdate';

const DeactivateAccountSection = ({
  user,
  updateUserWrapper,
}: {
  user: UsersEdit,
  updateUserWrapper: UpdateUserWrapper,
}) => {
  const { ActionButtonSection } = Components;
  const { mutate: updateUser, loading } = useUpdate({
    collectionName: "Users",
    fragmentName: 'UsersEdit',
  });

  const disableDeactivateButton = !!user.permanentDeletionRequestedAt && !!user.deleted;

  return (
    <ActionButtonSection
      description="Deactivating your account means your posts and comments will be listed as '[Anonymous]', and your user profile won't accessible. This can be reversed at any time."
      buttonText={`${user.deleted ? "Reactivate" : "Deactivate"} account`}
      buttonProps={{ variant: "contained", disabled: disableDeactivateButton }}
      loading={loading}
      onClick={() => {
        void updateUserWrapper({
          updateUser,
          data: { deleted: !user.deleted }
        })
      }}
    />
  );
};

const DeactivateAccountSectionComponent = registerComponent('DeactivateAccountSection', DeactivateAccountSection);

declare global {
  interface ComponentTypes {
    DeactivateAccountSection: typeof DeactivateAccountSectionComponent
  }
}

export default DeactivateAccountSectionComponent;
