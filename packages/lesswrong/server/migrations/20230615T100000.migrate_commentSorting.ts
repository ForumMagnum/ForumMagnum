export const up = async ({db}: MigrationContext) => {
  await db.none(`UPDATE "Users" SET "commentSorting" = 'postCommentsMagic' WHERE "commentSorting" = 'postCommentsTop'`)
}

export const down = async ({db}: MigrationContext) => {
  await db.none(`UPDATE "Users" SET "commentSorting" = 'postCommentsTop' WHERE "commentSorting" = 'postCommentsMagic'`)
}
