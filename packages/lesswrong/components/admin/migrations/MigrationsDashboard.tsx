import React from 'react';
import { Components, registerComponent } from '../../../lib/vulcan-lib/components';
import { userIsAdmin } from '../../../lib/vulcan-users/permissions';
import { useCurrentUser } from '../../common/withUser';
import { gql } from '@apollo/client';
import { useQuery } from '@/lib/crud/useQuery';
import { rowStyles } from './MigrationsDashboardRow';

const styles = (theme: ThemeType) => ({
  ...rowStyles,
  row: {
    display: 'flex',
    fontWeight: 'bold',
    fontSize: 17,
    borderBottom: theme.palette.border.tableHeadingDivider,
    marginBottom: theme.spacing.unit / 2,
  }
});

const MigrationsDashboard = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {
  const currentUser = useCurrentUser();
  const { SingleColumnSection, Loading, SectionTitle } = Components;
  const { data, loading } = useQuery(gql`
    query MigrationsDashboardQuery {
      MigrationsDashboard {
        migrations {
          name
          dateWritten
          runs { name started finished succeeded }
          lastRun
        }
      }
    }
  `, { ssr: true });
  
  if (!userIsAdmin(currentUser)) {
    return <SingleColumnSection>Sorry, you need to be logged in as an admin to use this page.</SingleColumnSection>;
  }
  
  return <SingleColumnSection>
    <SectionTitle title="Migrations" />
    {loading && <Loading/>}
    <div className={classes.row}>
      <span className={classes.name}>Name</span>
      <span className={classes.middleColumn}>Date Written</span>
      <span className={classes.middleColumn}>Status</span>
      <span className={classes.lastRun}>Last Run (Started)</span>
    </div>
    {data?.MigrationsDashboard?.migrations && data.MigrationsDashboard.migrations.map((migration: AnyBecauseTodo) =>
      <Components.MigrationsDashboardRow key={migration.name} migration={migration}/>)}
  </SingleColumnSection>;
}

const MigrationsDashboardComponent = registerComponent(
  "MigrationsDashboard", MigrationsDashboard, {styles}
);

declare global {
  interface ComponentTypes {
    MigrationsDashboard: typeof MigrationsDashboardComponent
  }
}
