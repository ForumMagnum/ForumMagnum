import PgCollection from "../../../lib/sql/PgCollection";
import AddFieldQuery from "../../../lib/sql/AddFieldQuery";
import UpdateDefaultValueQuery from "../../../lib/sql/UpdateDefaultValueQuery";
import UpdateFieldTypeQuery from "../../../lib/sql/UpdateFieldTypeQuery";

export const addField = async <T extends DbObject>(
  db: SqlClient,
  collection: PgCollection<T>,
  fieldName: keyof T & string,
): Promise<void> => {
  const {sql} = new AddFieldQuery(collection.getTable(), fieldName).compile();
  await db.none(sql);
}

export const updateDefaultValue = async <T extends DbObject>(
  db: SqlClient,
  collection: PgCollection<T>,
  fieldName: keyof T & string,
): Promise<void> => {
  const {sql} = new UpdateDefaultValueQuery(collection.getTable(), fieldName).compile();
  await db.none(sql);
}

export const updateFieldType = async <T extends DbObject>(
  db: SqlClient,
  collection: PgCollection<T>,
  fieldName: keyof T & string,
): Promise<void> => {
  const {sql} = new UpdateFieldTypeQuery(collection.getTable(), fieldName).compile();
  await db.none(sql);
}
