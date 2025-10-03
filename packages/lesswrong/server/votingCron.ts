import { batchUpdateScore } from './updateScores';
import { getVoteableCollections } from '@/server/collections/allCollections';

// Setting voting.scoreUpdateInterval removed and replaced with a hard-coded
// interval because the time-parsing library we use can't handle numbers of
// seconds >= 60; rather than treat them as minutes (like you'd expect), it
// treats intervals like "every 100 seconds" as a syntax error.

export async function updateScoreActiveDocuments() {
  for (const collection of getVoteableCollections()) {
    const options = collection.options.voteable!;
    if (options.timeDecayScoresCronjob) {
      await batchUpdateScore({collection});
    }
  }
}

export async function updateScoreInactiveDocuments() {
  for (const collection of getVoteableCollections()) {
    const options = collection.options.voteable!;
    if (options.timeDecayScoresCronjob) {
      await batchUpdateScore({collection, inactive: true});
    }
  }
}
