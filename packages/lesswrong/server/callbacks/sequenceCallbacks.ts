/**
 * Gives a new sequence its first (untitled) chapter. Awaited rather than run
 * as a background task: the sequence editor opens a new sequence straight
 * after creating it, and needs the chapter to exist.
 */
export async function createFirstChapter(sequence: DbSequence, context: ResolverContext) {
  const { Chapters } = context;
  if (sequence._id) {
    await Chapters.rawInsert({
      sequenceId: sequence._id,
      postIds: [],
      contents: null,
      contents_latest: null,
      title: null,
      subtitle: null,
      number: null,
    });
  }
}
