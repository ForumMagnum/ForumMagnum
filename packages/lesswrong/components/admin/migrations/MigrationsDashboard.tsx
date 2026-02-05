"use client";

import React from 'react';
import { userIsAdmin } from '../../../lib/vulcan-users/permissions';
import { useCurrentUser } from '../../common/withUser';
import { useQuery } from "@/lib/crud/useQuery";
import MigrationsDashboardRow, { rowStyles } from './MigrationsDashboardRow';
import SingleColumnSection from "../../common/SingleColumnSection";
import Loading from "../../vulcan-core/Loading";
import SectionTitle from "../../common/SectionTitle";
import { gql } from '@/lib/generated/gql-codegen';
import { defineStyles } from '@/components/hooks/defineStyles';
import { useStyles } from '@/components/hooks/useStyles';

const styles = defineStyles("MigrationsDashboard", (theme: ThemeType) => ({
  ...rowStyles,
  row: {
    display: 'flex',
    fontWeight: 'bold',
    fontSize: 17,
    borderBottom: theme.palette.border.tableHeadingDivider,
    marginBottom: theme.spacing.unit / 2,
  }
}));

const MigrationsDashboard = () => {
  const classes = useStyles(styles);
  const currentUser = useCurrentUser();
  const { data, loading } = useQuery(gql(`
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
  `), { ssr: true });
  
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
      <MigrationsDashboardRow key={migration.name} migration={migration}/>)}
  </SingleColumnSection>;
}

export default MigrationsDashboard;


