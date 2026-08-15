import Sequences from '@/server/collections/sequences/collection';
import SequencesRepo from '@/server/repos/SequencesRepo';

/**
 * Dev helper: print the derived library tags (SequencesRepo.getDerivedTags)
 * for a sequence, looked up by exact title. Run with `yarn repl dev lw` and
 * call debugSequenceTags("The Methods of Rationality").
 */
export async function debugSequenceTags(title: string) {
  /* eslint-disable no-console */
  const sequence = await Sequences.findOne({ title, isDeleted: false });
  if (!sequence) {
    console.log(`No sequence titled "${title}"`);
    return;
  }
  const [tags = []] = await new SequencesRepo().getDerivedTags([sequence._id]);
  console.log(`${sequence.title} [${sequence._id}]: ${tags.map(tag => tag.name).join(', ') || '(none)'}`);
}
