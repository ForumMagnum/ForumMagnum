import PgCollection from "../../../lib/sql/PgCollection";
import AddFieldQuery from "../../../lib/sql/AddFieldQuery";

export const addField = async <T extends DbObject>(
  db: SqlClient,
  collection: PgCollection<T>,
  fieldName: string,
): Promise<void> => {
  const {sql} = new AddFieldQuery(collection.getTable(), fieldName).compile();
  await db.none(sql);
}
