import { getSqlClientOrThrow } from '../../server/sql/sqlClient';
import { registerMigration } from './migrationUtils';

// This updates the functions created in packages/lesswrong/server/manualMigrations/2023-01-13-createViewUpdater.ts
// to handle the case where a table name is already lowercase
registerMigration({
  name: "viewUpdaterErrorHandling",
  dateWritten: "2023-07-28",
  idempotent: true,
  action: async () => {
    const db = getSqlClientOrThrow();

    // In both queries below 'rec' will have the following shape:
    // | table_name     | cols                                                     |
    // |----------------|----------------------------------------------------------|
    // | AdvisorRequests| "jobAds" as jobAds, "schemaVersion" as schemaVersion,... |
    // |...             |...                                                       |
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
        BEGIN
            IF rec.table_name != LOWER(rec.table_name) THEN
                EXECUTE format(E'drop view if exists %I; create view %I as select %s from %I;',
                    LOWER(rec.table_name), LOWER(rec.table_name), rec.cols, rec.table_name);
            END IF;
        EXCEPTION
          WHEN others THEN
            RAISE WARNING 'Unable to refresh view: %', rec.table_name;
        END;
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
        BEGIN
          IF rec.table_name != LOWER(rec.table_name) THEN
              EXECUTE format(E'drop view if exists %I', LOWER(rec.table_name));
          END IF;
        EXCEPTION
          WHEN others THEN
            RAISE WARNING 'Unable to drop view: %', rec.table_name;
        END;
      END LOOP;
    END;
    $$
    LANGUAGE plpgsql;
    `
    await db.any(sql)
  }
})
