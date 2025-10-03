import Migrations from '../../server/collections/migrations/collection';
import { availableMigrations } from './migrationUtils';
import moment from 'moment';
import gql from 'graphql-tag';
import groupBy from 'lodash/groupBy';
import sortBy from 'lodash/sortBy';
import max from 'lodash/max';

export const migrationsDashboardGraphQLTypeDefs = gql`
  type MigrationsDashboardData {
    migrations: [MigrationStatus!]
  }
  type MigrationStatus {
    name: String!
    dateWritten: String
    runs: [MigrationRun!]
    lastRun: String
  }
  type MigrationRun {
    name: String!
    started: Date!
    finished: Date
    succeeded: Boolean
  }
  extend type Query {
    MigrationsDashboard: MigrationsDashboardData
  }
`;

export const migrationsDashboardGraphQLQueries = {
  MigrationsDashboard: async (root: void, args: void, context: ResolverContext) => {
    if (!context.currentUser || !context.currentUser.isAdmin)
      throw new Error("MigrationsDashboard graphQL API requires being logged in as an admin");
    
    const allMigrationRuns = await Migrations.find({}).fetch();
    const runsByMigration = groupBy(allMigrationRuns, m=>m.name);
    
    const migrationNamesByDateWrittenDesc =
      sortBy(
        Object.entries(availableMigrations),
        ([name, {dateWritten}]) => dateWritten
      )
      .reverse()
      .map(([name, migration]) => name);
    
    return {
      migrations: migrationNamesByDateWrittenDesc
        .map(name => makeMigrationStatus(name, runsByMigration))
    };
  }
};

const makeMigrationStatus = (name: string, runsByMigration: AnyBecauseTodo) => {
  const runs = runsByMigration[name]?.map((run: AnyBecauseTodo) => ({
    name: run.name,
    started: new Date(run.started),
    finished: run.finished ? new Date(run.finished) : null,
    succeeded: run.succeeded,
  })) || []

  let lastRun = ''
  if (runs.length) {
    const startDates = runs.map((run: AnyBecauseTodo) => run.started)
    lastRun = moment.utc(max(startDates)).format('YYYY-MM-DD')
  }

  const result = {
    name,
    dateWritten: availableMigrations[name].dateWritten,
    runs,
    lastRun,
  }
  return result
}
