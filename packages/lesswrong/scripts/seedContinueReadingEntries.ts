import Users from '@/server/collections/users/collection';
import Sequences from '@/server/collections/sequences/collection';
import Chapters from '@/server/collections/chapters/collection';
import Posts from '@/server/collections/posts/collection';

/**
 * Dev-only helper: seed the agent-test account with N partially-read
 * sequences so the /library continue-reading strip can be visually tested
 * with many entries. Run with `yarn repl dev lw` and call
 * seedContinueReadingEntries().
 */
export async function seedContinueReadingEntries(count = 6) {
  /* eslint-disable no-console */
  const user = await Users.findOne({ username: 'agent-test' });
  if (!user) throw new Error('agent-test user not found');

  const sequences = await Sequences.find(
    { gridImageId: { $ne: null }, isDeleted: false, draft: false, hidden: false },
    { limit: 40, sort: { userProfileOrder: 1 } },
  ).fetch();

  // Vary progress so the strip shows both the start-reading button (0 read)
  // and progress bars at different percentages.
  const numReadPattern = [0, 1, 2, 4, 6, 9];
  const entries: any[] = [];
  for (const sequence of sequences) {
    if (entries.length >= count) break;
    const chapters = await Chapters.find({ sequenceId: sequence._id }).fetch();
    const postIds = chapters.flatMap(chapter => chapter.postIds ?? []);
    if (postIds.length < 2) continue;
    const nextPost = await Posts.findOne({ _id: postIds[1], draft: false });
    if (!nextPost) continue;
    const numRead = Math.min(numReadPattern[entries.length % numReadPattern.length], postIds.length - 1);
    entries.push({
      sequenceId: sequence._id,
      lastReadPostId: postIds[0],
      nextPostId: postIds[1],
      numRead,
      numTotal: postIds.length,
      lastReadTime: new Date(Date.now() - entries.length * 86400000),
    });
  }

  await Users.rawUpdateOne({ _id: user._id }, { $set: { partiallyReadSequences: entries } });
  console.log(`Seeded ${entries.length} entries:`, entries.map(e => e.sequenceId));
}
