export const acceptsSchemaHash = "c474d685fecb4d58a3d23e9d419f859a";

import ReviewWinnerArts from "../../lib/collections/reviewWinnerArts/collection";
import SplashArtCoordinates from "../../lib/collections/splashArtCoordinates/collection";
import { createTable, dropTable } from "./meta/utils"

export const up = async ({db}: MigrationContext) => {
  await createTable(db, ReviewWinnerArts);
  await createTable(db, SplashArtCoordinates);
}

export const down = async ({db}: MigrationContext) => {
  await dropTable(db, ReviewWinnerArts);
  await dropTable(db, SplashArtCoordinates);
}
