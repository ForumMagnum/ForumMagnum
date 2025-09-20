import { backgroundTask } from "../utils/backgroundTask";

export function createFirstChapter(sequence: DbSequence, context: ResolverContext) {
  const { Chapters } = context;
  if (sequence._id) {
    backgroundTask(Chapters.rawInsert({
      sequenceId: sequence._id,
      postIds: [],
      contents: null,
      contents_latest: null,
      title: null,
      subtitle: null,
      number: null,
    }))
  }
}
