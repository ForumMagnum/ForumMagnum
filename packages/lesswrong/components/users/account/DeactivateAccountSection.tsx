import { registerComponent } from '@/lib/vulcan-lib/components';
import React from 'react';
import { useUpdate } from '@/lib/crud/withUpdate';
import { useFlashErrors } from '@/components/hooks/useFlashErrors';
import { ActionButtonSection } from "./ActionButtonSection";

const DeactivateAccountSectionInner = ({
  user,
}: {
  user: UsersEdit,
}) => {
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

export const DeactivateAccountSection = registerComponent('DeactivateAccountSection', DeactivateAccountSectionInner);




