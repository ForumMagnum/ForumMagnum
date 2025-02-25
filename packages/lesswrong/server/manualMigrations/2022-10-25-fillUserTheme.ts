import { registerMigration, fillDefaultValues } from "./migrationUtils";
import Users from "../../lib/collections/users/collection";

export default registerMigration({
  name: "fillUserTheme",
  dateWritten: "2022-10-25",
  idempotent: true,
  action: async () => {
    await fillDefaultValues({
      collection: Users,
      fieldName: "theme",
    });
  },
});
