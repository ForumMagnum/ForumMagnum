
export const up = async ({db}: MigrationContext) => {
  await db.none(`
    DROP MATERIALIZED VIEW fm_get_user_by_login_token
  `);
}

export const down = async ({db}: MigrationContext) => {
}
