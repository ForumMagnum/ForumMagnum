import Spotlights from "../collections/spotlights/collection";
import { addField, addRemovedField, dropField } from "./meta/utils";
import {
  BoolType,
  DateType,
  DefaultValueType,
  FloatType,
  IntType,
  NotNullType,
  StringType,
} from "../sql/Type";

export const up = async ({db}: MigrationContext) => {
  await db.tx(async (db) => {
    await db.none(`ALTER TABLE "Spotlights" RENAME "customTitle" TO "title"`);
    await db.none(`ALTER TABLE "Spotlights" RENAME "spotlightImageId" TO "imageId"`);
    await dropField(db, Spotlights, "position");
    await dropField(db, Spotlights, "duration");
    await dropField(db, Spotlights, "customSubtitle");
    await dropField(db, Spotlights, "subtitleUrl");
    await dropField(db, Spotlights, "headerTitle");
    await dropField(db, Spotlights, "headerTitleLeftColor");
    await dropField(db, Spotlights, "headerTitleRightColor");
    await dropField(db, Spotlights, "lastPromotedAt");
    await dropField(db, Spotlights, "spotlightSplashImageUrl");
    await dropField(db, Spotlights, "draft");
    await dropField(db, Spotlights, "deletedDraft");
    await dropField(db, Spotlights, "showAuthor");
    await dropField(db, Spotlights, "spotlightDarkImageId");
    await dropField(db, Spotlights, "imageFade");
    await addField(db, Spotlights, "startAt");
    await addField(db, Spotlights, "endAt");
  });
}

export const down = async ({db}: MigrationContext) => {
  await db.tx(async (db) => {
    await db.none(`ALTER TABLE "Spotlights" RENAME "title" TO "customTitle"`);
    await db.none(`ALTER TABLE "Spotlights" RENAME "imageId" TO "spotlightImageId"`);
    await addRemovedField(db, Spotlights, "position", new NotNullType(new IntType()));
    await addRemovedField(db, Spotlights, "duration",
        new DefaultValueType(new NotNullType(new FloatType()), 3));
    await addRemovedField(db, Spotlights, "customSubtitle", new StringType());
    await addRemovedField(db, Spotlights, "subtitleUrl", new StringType());
    await addRemovedField(db, Spotlights, "headerTitle", new StringType());
    await addRemovedField(db, Spotlights, "headerTitleLeftColor", new StringType());
    await addRemovedField(db, Spotlights, "headerTitleRightColor", new StringType());
    await addRemovedField(db, Spotlights, "lastPromotedAt",
      new DefaultValueType(new NotNullType(new DateType()), new Date(0)));
    await addRemovedField(db, Spotlights, "spotlightSplashImageUrl", new StringType());
    await addRemovedField(db, Spotlights, "draft",
      new DefaultValueType(new NotNullType(new BoolType()), true));
    await addRemovedField(db, Spotlights, "deletedDraft",
      new DefaultValueType(new NotNullType(new BoolType()), false));
    await addRemovedField(db, Spotlights, "showAuthor",
      new DefaultValueType(new NotNullType(new BoolType()), false));
    await addRemovedField(db, Spotlights, "spotlightDarkImageId", new StringType());
    await addRemovedField(db, Spotlights, "imageFade",
      new DefaultValueType(new NotNullType(new BoolType()), true));
    await dropField(db, Spotlights, "startAt");
    await dropField(db, Spotlights, "endAt");
  });
}
