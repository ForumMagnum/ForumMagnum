import { Components, registerComponent } from '@/lib/vulcan-lib';
import React, { useEffect } from 'react';
import { useLoginPopoverContext } from '@/components/hooks/useLoginPopoverContext';

const ChangeLoginDetailsSection = ({
  user,
}: {
  user: UsersEdit,
}) => {
  const { ActionButtonSection, EALoginPopover } = Components;
  const {onChangeLogin} = useLoginPopoverContext();

  // TODO remove, here for debugging
  useEffect(() => {
    onChangeLogin()
  }, [onChangeLogin])

  return (
    <>
      <ActionButtonSection
        description="Change your email or switch between email/password and social login."
        buttonText={"Change login details"}
        buttonProps={{ variant: "contained" }}
        loading={false}
        onClick={() => {
          onChangeLogin();
        }}
      />
      <EALoginPopover />
    </>
  );
};

const ChangeLoginDetailsSectionComponent = registerComponent('ChangeLoginDetailsSection', ChangeLoginDetailsSection);

declare global {
  interface ComponentTypes {
    ChangeLoginDetailsSection: typeof ChangeLoginDetailsSectionComponent
  }
}

export default ChangeLoginDetailsSectionComponent;
