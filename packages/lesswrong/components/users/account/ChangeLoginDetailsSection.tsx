import { Components, registerComponent } from '@/lib/vulcan-lib';
import React from 'react';
import { useUpdate } from '@/lib/crud/withUpdate';
import { useFlashErrors } from '@/components/hooks/useFlashErrors';

const ChangeLoginDetailsSection = ({
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

  return (
    <ActionButtonSection
      description="TODO blurb"
      buttonText={"Change login details"}
      buttonProps={{ variant: "contained" }}
      loading={loading}
      onClick={() => {
        void updateUser({
          selector: { slug: user.slug },
          data: { deleted: !user.deleted },
        });
      }}
    />
  );
};

const ChangeLoginDetailsSectionComponent = registerComponent('ChangeLoginDetailsSection', ChangeLoginDetailsSection);

declare global {
  interface ComponentTypes {
    ChangeLoginDetailsSection: typeof ChangeLoginDetailsSectionComponent
  }
}

export default ChangeLoginDetailsSectionComponent;
