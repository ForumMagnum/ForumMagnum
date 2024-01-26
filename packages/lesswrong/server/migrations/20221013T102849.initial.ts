import { installExtensions, updateFunctions } from "./meta/utils";

export const up = async ({db}: MigrationContext) => {
  // The default TOAST compression in PG uses pglz - here we switch to lz4 which
  // uses slightly more disk space in exchange for _much_ faster compression and
  // decompression times
  await db.none("SET default_toast_compression = lz4");

  await installExtensions(db);
  await updateFunctions(db);
}
