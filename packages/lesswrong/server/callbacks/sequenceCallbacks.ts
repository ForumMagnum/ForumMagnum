export function createFirstChapter(sequence: DbSequence, context: ResolverContext) {
  const { Chapters } = context;
  if (sequence._id) {
    void Chapters.rawInsert({sequenceId:sequence._id, postIds: []})
  }
}
