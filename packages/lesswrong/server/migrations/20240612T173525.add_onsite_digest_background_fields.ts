import Digests from "@/lib/collections/digests/collection";
import { addField, dropField } from "./meta/utils";

/**
 * Generated on 2024-06-12T17:35:25.639Z by `yarn makemigrations`
 * The following schema changes were detected:
 * -------------------------------------------
 * diff --git a/Users/sarah/EAForum/schema/accepted_schema.sql b/Users/sarah/EAForum/schema/schema_to_accept.sql
 * index a059661626..c598b324fd 100644
 * --- a/Users/sarah/EAForum/schema/accepted_schema.sql
 * +++ b/Users/sarah/EAForum/schema/schema_to_accept.sql
 * @@ -4,5 +4,3 @@
 *  --
 * --- Overall schema hash: 6916cc5096e4eeee5bc92639da67e9fa
 * -
 * --- Accepted on 2024-06-11T18:25:02.000Z by 20240611T182502.add_Posts_userId_postedAt_idx.ts
 * +-- Overall schema hash: c1dd7ed968b6af5a78625296b5e5fec0
 *  
 * 
 * -------------------------------------------
 * (run `git diff --no-index schema/accepted_schema.sql schema/schema_to_accept.sql` to see this more clearly)
 *
 * - [ ] Write a migration to represent these changes
 * - [ ] Rename this file to something more readable
 * - [ ] Uncomment `acceptsSchemaHash` below
 * - [ ] Run `yarn acceptmigrations` to update the accepted schema hash (running makemigrations again will also do this)
 */
export const acceptsSchemaHash = "c1dd7ed968b6af5a78625296b5e5fec0";

export const up = async ({db}: MigrationContext) => {
  await addField(db, Digests, "onsiteImageId");
  await addField(db, Digests, "onsitePrimaryColor");
}

export const down = async ({db}: MigrationContext) => {
  await dropField(db, Digests, "onsiteImageId");
  await dropField(db, Digests, "onsitePrimaryColor");
}

