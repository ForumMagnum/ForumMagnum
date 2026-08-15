import Tags from '@/server/collections/tags/collection';
import SequencesRepo from '@/server/repos/SequencesRepo';

/**
 * Dev helper: exercise the /library wikitag filter
 * (SequencesRepo.searchLibrarySequences filterTagIds). Run with
 * `yarn repl dev lw` and call debugLibraryWikitagFilter("logical-uncertainty").
 */
export async function debugLibraryWikitagFilter(tagSlug: string) {
  /* eslint-disable no-console */
  const tag = await Tags.findOne({ slug: tagSlug, deleted: false });
  if (!tag) {
    console.log(`No tag with slug "${tagSlug}"`);
    return;
  }
  const repo = new SequencesRepo();
  const unfiltered = await repo.searchLibrarySequences({
    query: '', filterTagIds: null, curatedOnly: false, sortBy: null, limit: 1000,
  });
  const filtered = await repo.searchLibrarySequences({
    query: '', filterTagIds: [tag._id], curatedOnly: false, sortBy: null, limit: 1000,
  });
  console.log(`Tag ${tag.name} [${tag._id}]: ${filtered.length}/${unfiltered.length} sequences match`);
  for (const sequence of filtered.slice(0, 15)) {
    console.log(`  - ${sequence.title}`);
  }
}
