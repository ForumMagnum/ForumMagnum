import { ClientIds } from "../collections/clientIds/collection";
import { updateIndexes } from "./meta/utils";

export const up = async () => {
  await updateIndexes(ClientIds);
}

export const down = up;
