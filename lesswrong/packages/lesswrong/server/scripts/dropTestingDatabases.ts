import { Vulcan } from "../../lib/vulcan-lib/config";
import { dropTestingDatabases } from "../testingSqlClient";

Vulcan.dropTestingDatabases = dropTestingDatabases;
