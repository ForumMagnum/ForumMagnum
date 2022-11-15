import { Vulcan } from "../vulcan-lib";
import { dropTestingDatabases } from "../../lib/sql/tests/testingSqlClient";

Vulcan.dropTestingDatabases = dropTestingDatabases;
