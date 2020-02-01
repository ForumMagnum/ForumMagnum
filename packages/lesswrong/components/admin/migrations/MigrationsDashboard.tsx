import React from 'react';
import { Components, registerComponent } from 'meteor/vulcan:core';
import Users from '../../../lib/collections/users/collection';
import { useCurrentUser } from '../../common/withUser';
import { useQuery } from 'react-apollo';
import gql from 'graphql-tag';

const migrationsQuery = gql`
  query MigrationsDashboardQuery {
    MigrationsDashboard {
      migrations {
        name
        dateWritten
        runs { name started finished succeeded }
      }
    }
  }
`;

const MigrationsDashboard = () => {
  const currentUser = useCurrentUser();
  const { SingleColumnSection, Loading } = Components;
  const { data, loading } = useQuery(migrationsQuery, { ssr: true });
  
  if (!Users.isAdmin(currentUser)) {
    return <SingleColumnSection>Sorry, you need to be logged in as an admin to use this page.</SingleColumnSection>;
  }
  
  return <SingleColumnSection>
    {loading && <Loading/>}
    {data?.MigrationsDashboard?.migrations && data.MigrationsDashboard.migrations.map(migration =>
      <Components.MigrationsDashboardRow key={migration.name} migration={migration}/>)}
  </SingleColumnSection>;
}

const MigrationsDashboardComponent = registerComponent("MigrationsDashboard", MigrationsDashboard);

declare global {
  interface ComponentTypes {
    MigrationsDashboard: typeof MigrationsDashboardComponent
  }
}
