import Chapters from "../../lib/collections/chapters/collection";
import Sequences from "../../lib/collections/sequences/collection";
import { randomId } from "../../lib/random";
import InsertQuery from "../../lib/sql/InsertQuery";

export const up = async ({db}: MigrationContext) => {
  if (Sequences.isPostgres() || !Chapters.isPostgres()) {
    return;
  }

  const [sequences, chapters] = await Promise.all([
    Sequences.find({}, {projection: {_id: 1}}).fetch(),
    Chapters.find({}, {projection: {_id: 1, sequenceId: 1}}).fetch(),
  ]);

  const newChapters: Partial<DbChapter>[] = [];

  for (const sequence of sequences) {
    const {_id} = sequence;
    const chapter = chapters.find(({sequenceId}) => sequenceId === _id);
    if (!chapter) {
      newChapters.push({
        _id: randomId(),
        sequenceId: _id,
        postIds: [] as string[],
        createdAt: new Date(),
      });
    }
  }

  if (newChapters.length) {
    const query = new InsertQuery(Chapters.table, newChapters as DbChapter[]);
    const {sql, args} = query.compile();
    await db.none(sql, args);
  }
}
