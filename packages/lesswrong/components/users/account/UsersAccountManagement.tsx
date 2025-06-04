import { registerComponent } from '@/lib/vulcan-lib/components';
import React from 'react';
import { userCanEditUser } from '@/lib/collections/users/helpers';
import { useCurrentUser } from '@/components/common/withUser';
import ErrorAccessDenied from "../../common/ErrorAccessDenied";
import DummyFormGroup from "../../form-components/DummyFormGroup";
import Loading from "../../vulcan-core/Loading";
import DeactivateAccountSection from "./DeactivateAccountSection";
import DeleteAccountSection from "./DeleteAccountSection";
import { gql } from '@/lib/generated/gql-codegen';
import { useQuery } from '@apollo/client';

const GetUserBySlugQuery = gql(`
  query UsersAccountManagementGetUserBySlug($slug: String!) {
    GetUserBySlug(slug: $slug) {
      ...UsersEdit
    }
  }
`);

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
  const currentUser = useCurrentUser();

  const { data } = useQuery(GetUserBySlugQuery, { variables: { slug } });
  const user = data?.GetUserBySlug;

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

export default registerComponent('UsersAccountManagement', UsersAccountManagement, {styles});


