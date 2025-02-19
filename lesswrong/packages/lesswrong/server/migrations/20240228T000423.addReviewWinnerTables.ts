export const acceptsSchemaHash = "ea9de36d7fd118012a686d5148193cde";

import ReviewWinnerArts from "../../lib/collections/reviewWinnerArts/collection";
import ReviewWinners from "../../lib/collections/reviewWinners/collection";
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
