import { Components, registerComponent } from '@/lib/vulcan-lib';
import React from 'react';
import { useUpdate } from '@/lib/crud/withUpdate';
import { useFlashErrors } from '@/components/hooks/useFlashErrors';

const DeactivateAccountSection = ({
  user,
}: {
  user: UsersEdit,
}) => {
  const { ActionButtonSection } = Components;
  const { mutate: rawUpdateUser, loading } = useUpdate({
    collectionName: "Users",
    fragmentName: 'UsersEdit',
  });
  const updateUser = useFlashErrors(rawUpdateUser);

  const disableDeactivateButton = !!user.permanentDeletionRequestedAt && !!user.deleted;

  return (
    <ActionButtonSection
      description="Deactivating your account means your posts and comments will be listed as '[Anonymous]', and your user profile won't be accessible. This can be reversed at any time."
      buttonText={`${user.deleted ? "Reactivate" : "Deactivate"} account`}
      buttonProps={{ variant: "contained", disabled: disableDeactivateButton }}
      loading={loading}
      onClick={() => {
        void updateUser({
          selector: { _id: user._id },
          data: { deleted: !user.deleted },
        });
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
