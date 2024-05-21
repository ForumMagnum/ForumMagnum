/**
 * List of the Postgres extensions required to run ForumMagnum. After editing
 * this list you must run `makemigrations` to generate a new schema hash and a
 * migration in which you should call `installExtensions`.
 */
export const postgresExtensions = [
  // btree_gin allows us to use a lot of BTREE operators with GIN indexes that
  // otherwise wouldn't work
  "btree_gin",
  // earthdistance is used for finding nearby events
  "earthdistance",
  // intarray is used for collab filtering recommendations
  "intarray",
  // vector is used for text embeddings
  "vector",
  // trigrams are used for searching facets in the people directory
  "pg_trgm",
] as const;

export type PostgresExtension = typeof postgresExtensions[number];
