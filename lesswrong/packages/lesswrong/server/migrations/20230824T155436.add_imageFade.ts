/**
 * Generated on 2023-08-24T15:54:36.914Z by `yarn makemigrations`
 * The following schema changes were detected:
 * -------------------------------------------
 * --- Overall schema hash: 87520014b627c9ee151523bd05e7bdae
 * -
 * --- Accepted on 2023-08-18T21:54:51.000Z by 20230818T215451.post_embeddings_have_vector_type.ts
 * +-- Overall schema hash: 4acff74195e36da33248763ab681bfd7
 *
 * @@ -837,3 +835,3 @@ CREATE TABLE "Sessions" (
 *
 * --- Schema for "Spotlights", hash: 2665439b064e8c84daaf637c511f11f0
 * +-- Schema for "Spotlights", hash: 0cbb6367e465b2bec1a8745fe38edd17
 *  CREATE TABLE "Spotlights" (
 * @@ -849,2 +847,3 @@ CREATE TABLE "Spotlights" (
 *      "showAuthor" bool NOT NULL DEFAULT false,
 * +    "imageFade" bool NOT NULL DEFAULT true,
 *      "spotlightImageId" text,
 */
export const acceptsSchemaHash = "4acff74195e36da33248763ab681bfd7";

import Spotlights from "../../lib/collections/spotlights/collection";
import { addField, dropField } from "./meta/utils";

export const up = async ({db}: MigrationContext) => {
  await addField(db, Spotlights, "imageFade");
}

export const down = async ({db}: MigrationContext) => {
  await dropField(db, Spotlights, "imageFade");
}
