import { batchUpdateScore } from './updateScores';
import { getVoteableCollections } from '@/server/collections/allCollections';

// Setting voting.scoreUpdateInterval removed and replaced with a hard-coded
// interval because the time-parsing library we use can't handle numbers of
// seconds >= 60; rather than treat them as minutes (like you'd expect), it
// treats intervals like "every 100 seconds" as a syntax error.

export function updateScoreActiveDocuments() {
  getVoteableCollections().forEach(collection => {
    const options = collection.options.voteable!;
    if (options.timeDecayScoresCronjob) {
      void batchUpdateScore({collection});
    }
  });
}

export function updateScoreInactiveDocuments() {
  getVoteableCollections().forEach(collection => {
    const options = collection.options.voteable!;
    if (options.timeDecayScoresCronjob) {
      void batchUpdateScore({collection, inactive: true});
    }
  });
}
