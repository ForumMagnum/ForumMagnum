import Users from "../../lib/collections/users/collection";

export const acceptsSchemaHash = "8f9b37b6b8213a24c21dba39e77f7bbb";

export const up = async ({db}: MigrationContext) => {
  if (!Users.isPostgres()) return

  await db.none(`UPDATE "Users" SET "commentSorting" = 'postCommentsMagic' WHERE "commentSorting" = 'postCommentsTop'`)
}

export const down = async ({db}: MigrationContext) => {
  if (!Users.isPostgres()) return

  await db.none(`UPDATE "Users" SET "commentSorting" = 'postCommentsTop' WHERE "commentSorting" = 'postCommentsMagic'`)
}
