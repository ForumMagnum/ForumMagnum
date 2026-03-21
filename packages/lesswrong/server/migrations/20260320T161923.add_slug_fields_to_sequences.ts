import { slugify, slugLooksLikeId } from "@/lib/utils/slugify";
import Sequences from "../collections/sequences/collection";
import { dropField } from "./meta/utils";

type SequenceMigrationRow = {
  _id: string,
  title: string,
  slug: string | null,
}

function getInitialSequenceSlug(title: string, usedSlugs: Set<string>) {
  const baseSlug = slugify(title);
  let nextSuffix = slugLooksLikeId(baseSlug) ? 1 : 0;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const candidateSlug = nextSuffix === 0 ? baseSlug : `${baseSlug}-${nextSuffix}`;
    if (!usedSlugs.has(candidateSlug)) {
      usedSlugs.add(candidateSlug);
      return candidateSlug;
    }
    nextSuffix += 1;
  }
}

export const up = async ({db}: MigrationContext) => {
  await db.none(`ALTER TABLE "Sequences" ADD COLUMN IF NOT EXISTS "slug" TEXT`);
  await db.none(`ALTER TABLE "Sequences" ADD COLUMN IF NOT EXISTS "oldSlugs" TEXT[]`);
  await db.none(`ALTER TABLE "Sequences" ALTER COLUMN "oldSlugs" SET DEFAULT '{}'::TEXT[]`);
  await db.none(`UPDATE "Sequences" SET "oldSlugs" = '{}'::TEXT[] WHERE "oldSlugs" IS NULL`);

  const sequences: SequenceMigrationRow[] = await db.any(`
    SELECT "_id", "title", "slug"
    FROM "Sequences"
    ORDER BY "createdAt" ASC, "_id" ASC
  `);

  const usedSlugs = new Set(
    sequences
      .map((sequence) => sequence.slug)
      .filter((slug): slug is string => !!slug)
  );

  for (const sequence of sequences) {
    if (sequence.slug) {
      continue;
    }

    const slug = getInitialSequenceSlug(sequence.title, usedSlugs);
    await db.none(
      `UPDATE "Sequences" SET "slug" = $2 WHERE "_id" = $1`,
      [sequence._id, slug],
    );
  }

  await db.none(`ALTER TABLE "Sequences" ALTER COLUMN "slug" SET NOT NULL`);
  await db.none(`ALTER TABLE "Sequences" ALTER COLUMN "oldSlugs" SET NOT NULL`);
}

export const down = async ({db}: MigrationContext) => {
  await dropField(db, Sequences, "oldSlugs");
  await dropField(db, Sequences, "slug");
}
