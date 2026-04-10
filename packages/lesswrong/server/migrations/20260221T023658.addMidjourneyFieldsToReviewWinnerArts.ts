import ReviewWinnerArts from "../collections/reviewWinnerArts/collection";
import { addField, dropField } from "./meta/utils";

export const up = async ({db}: MigrationContext) => {
  await addField(db, ReviewWinnerArts, "midjourneyJobId");
  await addField(db, ReviewWinnerArts, "midjourneyImageIndex");
  await addField(db, ReviewWinnerArts, "upscaledImageUrl");
}

export const down = async ({db}: MigrationContext) => {
  await dropField(db, ReviewWinnerArts, "midjourneyJobId");
  await dropField(db, ReviewWinnerArts, "midjourneyImageIndex");
  await dropField(db, ReviewWinnerArts, "upscaledImageUrl");
}
