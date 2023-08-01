import { EMBEDDINGS_VECTOR_SIZE } from "../../lib/collections/postEmbeddings/schema";

export const acceptsSchemaHash = "92d86f7f1604cb3549a341bbb15a079e";

export const up = async ({db}: MigrationContext) => {
  const n = EMBEDDINGS_VECTOR_SIZE;
  await db.tx(async (tx) => {
    await tx.none(`
      DROP FUNCTION IF EXISTS fm_dot_product
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
