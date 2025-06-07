import { registerComponent } from '@/lib/vulcan-lib/components';
import React from 'react';
import { useFlashErrors } from '@/components/hooks/useFlashErrors';
import ActionButtonSection from "./ActionButtonSection";
import { useMutation } from "@apollo/client";
import { gql } from "@/lib/crud/wrapGql";

const UsersEditUpdateMutation = gql(`
  mutation updateUserDeactivateAccountSection($selector: SelectorInput!, $data: UpdateUserDataInput!) {
    updateUser(selector: $selector, data: $data) {
      data {
        ...UsersEdit
      }
    }
  }
`);

const DeactivateAccountSection = ({
  user,
}: {
  user: UsersEdit,
}) => {
  const [rawUpdateUser, { loading }] = useMutation(UsersEditUpdateMutation);
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
          variables: {
            selector: { _id: user._id },
            data: { deleted: !user.deleted },
          }
        });
      }}
    />
  );
};

export default registerComponent('DeactivateAccountSection', DeactivateAccountSection);




