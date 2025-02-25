import { DatabaseIndexSet } from "@/lib/utils/databaseIndexSet";

type FacetField = {
  name: string,
  pgField: string,
}

const allowedFacetFields: FacetField[] = [
  {name: "jobTitle", pgField: `"jobTitle"`},
  {name: "organization", pgField: `"organization"`},
  {name: "mapLocationAddress", pgField: `"mapLocation"->>'formatted_address'`},
];

export const getFacetField = (facetFieldName: string): FacetField => {
  const facetField = allowedFacetFields.find(({name}) => name === facetFieldName);
  if (!facetField) {
    throw new Error(`Invalid facet field: ${facetFieldName}`);
  }
  return facetField;
}

export const getDefaultFacetFieldSelector = (pgField: string): string => `
  ${pgField} IS NOT NULL AND
  "noindex" IS NOT TRUE AND
  "hideFromPeopleDirectory" IS NOT TRUE AND
  "deleted" IS NOT TRUE AND
  "voteBanned" IS NOT TRUE AND
  "deleteContent" IS NOT TRUE AND
  "nullifyVotes" IS NOT TRUE AND
  "banned" IS NULL
`;

export function getFacetFieldIndexes(): DatabaseIndexSet {
  const indexSet = new DatabaseIndexSet();
  for (const {name, pgField} of allowedFacetFields) {
    indexSet.addCustomPgIndex(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_Users_tsvector_${name}"
      ON "Users" (TO_TSVECTOR('english', ${pgField}))
      WHERE ${getDefaultFacetFieldSelector(pgField)}
    `);
  }
  return indexSet;
}
