import Users from "../../lib/collections/users/collection";

export const up = async ({db}: MigrationContext) => {
  if (!Users.isPostgres()) return

  await db.none(`UPDATE "Users" SET "commentSorting" = 'postCommentsMagic' WHERE "commentSorting" = 'postCommentsTop'`)
}

export const down = async ({db}: MigrationContext) => {
  if (!Users.isPostgres()) return

  await db.none(`UPDATE "Users" SET "commentSorting" = 'postCommentsTop' WHERE "commentSorting" = 'postCommentsMagic'`)
}
