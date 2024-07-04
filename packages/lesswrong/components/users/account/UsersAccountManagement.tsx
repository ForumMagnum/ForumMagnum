import { Components, registerComponent } from '@/lib/vulcan-lib';
import { useMessages } from '@/components/common/withMessages';
import React, { useCallback } from 'react';
import { userCanEditUser } from '@/lib/collections/users/helpers';
import { useCurrentUser } from '@/components/common/withUser';
import { useUpdate } from '@/lib/crud/withUpdate';
import { useSingle } from '@/lib/crud/withSingle';

const styles = (theme: ThemeType) => ({
  root: {},
  actionsWrapper: {
    padding: '8px 0',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
})

export type UpdateUserWrapper = (args: {updateUser: WithUpdateFunction<"Users">, data: NullablePartial<DbUser>}) => Promise<void>;

const UsersAccountManagement = ({terms: { slug }, classes}: {
  terms: {slug: string},
  classes: ClassesType<typeof styles>,
}) => {
  const { ErrorAccessDenied, DummyFormGroup, Loading, DeactivateAccountSection, DeleteAccountSection } = Components;

  const currentUser = useCurrentUser();
  const {document: user} = useSingle({
    slug,
    collectionName: "Users",
    fragmentName: "UsersEdit",
  });
  const { flash } = useMessages();

  // TODO make this a generic part of the hook
  const updateUserWrapper: UpdateUserWrapper = useCallback(async ({updateUser, data}) => {
    try {
      await updateUser({
        selector: { slug },
        data,
      });
    } catch (error) {
      flash({ type: "error", messageString: error.message || "Failed to update user." });
    }
  }, [flash, slug]);

  if (!user) {
    return <Loading />
  }

  if(!userCanEditUser(currentUser, user)) {
    return <ErrorAccessDenied />;
  }

  return (
    <div className={classes.root}>
      <DummyFormGroup label={"Deactivate account"} startCollapsed={true}>
        <div className={classes.actionsWrapper}>
          <DeactivateAccountSection
            user={user}
            updateUserWrapper={updateUserWrapper}
          />
          <DeleteAccountSection
            user={user}
            updateUserWrapper={updateUserWrapper}
          />
        </div>
      </DummyFormGroup>
    </div>
  );
};

const UsersAccountManagementComponent = registerComponent('UsersAccountManagement', UsersAccountManagement, {styles});

declare global {
  interface ComponentTypes {
    UsersAccountManagement: typeof UsersAccountManagementComponent
  }
}
