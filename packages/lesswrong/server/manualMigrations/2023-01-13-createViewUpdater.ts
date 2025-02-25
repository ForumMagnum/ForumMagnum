import { getSqlClientOrThrow } from '../../server/sql/sqlClient';
import { registerMigration } from './migrationUtils';

// Postgres tables have weird casing because of legacy requirements
// This creates a set of views which are a case insensitive copy of the actual tables
//
// NOTE: This is not the most up to date version of this migration, a new version is in
// packages/lesswrong/server/manualMigrations/2023-07-28-viewUpdaterErrorHandling.ts
export default registerMigration({
  name: "createViewUpdater",
  dateWritten: "2023-01-13",
  idempotent: true,
  action: async () => {
    const db = getSqlClientOrThrow();

    const sql = `
    create or replace function refresh_lowercase_views() returns void as
    $$
    DECLARE
        rec record;
    BEGIN
      FOR rec IN 
        select table_name,
          string_agg(format('%I as %s', column_name, column_name), ', ') cols
        from information_schema."columns"
        inner join information_schema."tables" using (table_name)
        where "columns".table_schema = 'public'
          and table_name not in ('migration_log')
          and table_type = 'BASE TABLE'
        group by table_name
      LOOP
        EXECUTE format(E'drop view if exists %s; create view %s as select %s from %I;',
            rec.table_name, rec.table_name, rec.cols, rec.table_name);
      END LOOP;
    END;
    $$
    LANGUAGE plpgsql;

    create or replace function remove_lowercase_views() returns void as
    $$
    DECLARE
        rec record;
    BEGIN
      FOR rec IN 
        select distinct table_name
        from information_schema."columns"
        inner join information_schema."tables" using (table_name)
        where "columns".table_schema = 'public'
          and table_name not in ('migration_log')
          and table_type = 'BASE TABLE'
        group by table_name
      LOOP
        EXECUTE format(E'drop view if exists %s', rec.table_name);
      END LOOP;
    END;
    $$
    LANGUAGE plpgsql;
    `
    await db.any(sql)
  }
})
