import { Components, registerComponent } from '@/lib/vulcan-lib/components.tsx';
import React from 'react';
import { userCanEditUser } from '@/lib/collections/users/helpers';
import { useCurrentUser } from '@/components/common/withUser';
import { useGetUserBySlug } from '@/components/hooks/useGetUserBySlug';

const styles = (_theme: ThemeType) => ({
  actionsWrapper: {
    padding: '8px 0',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
})

const UsersAccountManagement = ({terms: { slug }, classes}: {
  terms: {slug: string},
  classes: ClassesType<typeof styles>,
}) => {
  const { ErrorAccessDenied, DummyFormGroup, Loading, DeactivateAccountSection, DeleteAccountSection } = Components;

  const currentUser = useCurrentUser();

  const { user } = useGetUserBySlug(slug, { fragmentName: 'UsersEdit' });

  if (!user) {
    return <Loading />
  }

  if(!userCanEditUser(currentUser, user)) {
    return <ErrorAccessDenied />;
  }

  return (
    <DummyFormGroup label={"Deactivate account"} startCollapsed={true}>
      <div className={classes.actionsWrapper}>
        <DeactivateAccountSection user={user} />
        <DeleteAccountSection user={user} />
      </div>
    </DummyFormGroup>
  );
};

const UsersAccountManagementComponent = registerComponent('UsersAccountManagement', UsersAccountManagement, {styles});

declare global {
  interface ComponentTypes {
    UsersAccountManagement: typeof UsersAccountManagementComponent
  }
}
