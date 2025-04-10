import { EMBEDDINGS_VECTOR_SIZE } from "../../lib/collections/postEmbeddings/newSchema";

export const acceptsSchemaHash = "87520014b627c9ee151523bd05e7bdae";

export const up = async ({db}: MigrationContext) => {
  const n = EMBEDDINGS_VECTOR_SIZE;
  await db.tx(async (tx) => {
    await tx.none(`
      DROP FUNCTION IF EXISTS fm_dot_product
    `);
    await tx.none(`
      CREATE EXTENSION IF NOT EXISTS "vector" CASCADE
    `);
    await tx.none(`
      ALTER TABLE "PostEmbeddings" ADD COLUMN "embeddings_tmp" VECTOR(${n})
    `);
    await tx.none(`
      UPDATE "PostEmbeddings" SET "embeddings_tmp" = "embeddings"::VECTOR(${n})
    `);
    await tx.none(`
      ALTER TABLE "PostEmbeddings" DROP COLUMN "embeddings" CASCADE
    `);
    await tx.none(`
      ALTER TABLE "PostEmbeddings" RENAME COLUMN "embeddings_tmp" TO "embeddings"
    `);
    await tx.none(`
      ALTER TABLE "PostEmbeddings" ALTER COLUMN "embeddings" SET NOT NULL
    `);
  });
}

export const down = async ({db}: MigrationContext) => {
  await db.tx(async (tx) => {
    await tx.none(`
      ALTER TABLE "PostEmbeddings" ADD COLUMN "embeddings_tmp" DOUBLE PRECISION[]
    `);
    await tx.none(`
      UPDATE "PostEmbeddings" SET "embeddings_tmp" = "embeddings"::DOUBLE PRECISION[]
    `);
    await tx.none(`
      ALTER TABLE "PostEmbeddings" DROP COLUMN "embeddings" CASCADE
    `);
    await tx.none(`
      ALTER TABLE "PostEmbeddings" RENAME COLUMN "embeddings_tmp" TO "embeddings"
    `);
    await tx.none(`
      ALTER TABLE "PostEmbeddings" ALTER COLUMN "embeddings" SET NOT NULL
    `);
  });
}
