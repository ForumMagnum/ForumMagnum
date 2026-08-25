import Collections from '@/server/collections/collections/collection';
import { getSqlClientOrThrow } from '@/server/sql/sqlClient';

/**
 * One-off dev-db data fix: point The Codex collection's portrait cover at the
 * custom art uploaded for the library redesign (the same image the
 * recommended-zone card uses), replacing the fallback to its spiral-book
 * grid icon. Run with `yarn repl dev lw`.
 */
export async function setCodexCoverImage() {
  /* eslint-disable no-console */
  const codexId = '2izXHCrmJ684AnZ5X';
  // The branch's 20260813T020000 migration (addField for coverImageId) hasn't
  // run on the dev db; apply the same idempotent column-adds first.
  const db = getSqlClientOrThrow();
  await db.none('ALTER TABLE "Collections" ADD COLUMN IF NOT EXISTS "coverImageId" TEXT');
  await db.none('ALTER TABLE "Sequences" ADD COLUMN IF NOT EXISTS "coverImageId" TEXT');
  const before = await Collections.findOne({ _id: codexId });
  console.log('Before:', {
    title: before?.title,
    coverImageId: before?.coverImageId,
    gridImageId: before?.gridImageId,
  });
  await Collections.rawUpdateOne(
    { _id: codexId },
    { $set: { coverImageId: 'sequences/okpfwqjpdam8czvradbx' } },
  );
  const after = await Collections.findOne({ _id: codexId });
  console.log('After:', { coverImageId: after?.coverImageId });
}
