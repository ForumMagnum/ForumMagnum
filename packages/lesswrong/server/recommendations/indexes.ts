import { ensureCustomPgIndex } from "../../lib/collectionIndexUtils";
import { createUniquePostUpvotersIndexQuery } from "./UniquePostUpvoters";

ensureCustomPgIndex(createUniquePostUpvotersIndexQuery);
