export const acceptsSchemaHash = "3ec56bc03693de9abb7f4a4c506dff4e";

import SplashArtCoordinates from "../../lib/collections/splashArtCoordinates/collection"
import { addField, dropField } from "./meta/utils"

export const up = async ({db}: MigrationContext) => {
  await addField(db, SplashArtCoordinates, 'leftFlipped')
  await addField(db, SplashArtCoordinates, 'middleFlipped')
  await addField(db, SplashArtCoordinates, 'rightFlipped')
}

export const down = async ({db}: MigrationContext) => {
  await dropField(db, SplashArtCoordinates, 'leftFlipped')
  await dropField(db, SplashArtCoordinates, 'middleFlipped')
  await dropField(db, SplashArtCoordinates, 'rightFlipped')
}
