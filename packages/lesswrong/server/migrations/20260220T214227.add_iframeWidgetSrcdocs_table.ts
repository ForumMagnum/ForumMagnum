import IframeWidgetSrcdocs from "../collections/iframeWidgetSrcdocs/collection";
import { createTable } from "./meta/utils"

export const up = async ({db}: MigrationContext) => {
  await createTable(db, IframeWidgetSrcdocs);
}

export const down = async ({db}: MigrationContext) => {
}
