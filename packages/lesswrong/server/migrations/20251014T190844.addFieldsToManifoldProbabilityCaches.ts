import { addField, dropField } from "./meta/utils";
import { ManifoldProbabilitiesCaches } from "../collections/manifoldProbabilitiesCaches/collection";

export const up = async ({db}: MigrationContext) => {
  await addField(db, ManifoldProbabilitiesCaches, "pool");
  await addField(db, ManifoldProbabilitiesCaches, "p");
  await addField(db, ManifoldProbabilitiesCaches, "mechanism");
};

export const down = async ({db}: MigrationContext) => {
  await dropField(db, ManifoldProbabilitiesCaches, "pool");
  await dropField(db, ManifoldProbabilitiesCaches, "p");
  await dropField(db, ManifoldProbabilitiesCaches, "mechanism");
}
