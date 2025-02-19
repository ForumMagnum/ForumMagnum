import { batchUpdateScore } from './updateScores';
import { VoteableCollections, VoteableCollectionOptions } from '../lib/make_voteable';
import { addCronJob } from './cronUtil';

// Setting voting.scoreUpdateInterval removed and replaced with a hard-coded
// interval because the time-parsing library we use can't handle numbers of
// seconds >= 60; rather than treat them as minutes (like you'd expect), it
// treats intervals like "every 100 seconds" as a syntax error.

addCronJob({
  name: 'updateScoreActiveDocuments',
  interval: `every 30 seconds`,
  job() {
    VoteableCollections.forEach(collection => {
      const options = VoteableCollectionOptions[collection.collectionName]!;
      if (options.timeDecayScoresCronjob) {
        void batchUpdateScore({collection});
      }
    });
  }
});
addCronJob({
  name: 'updateScoreInactiveDocuments',
  interval: 'every 24 hours',
  job() {
    VoteableCollections.forEach(collection => {
      const options = VoteableCollectionOptions[collection.collectionName]!;
      if (options.timeDecayScoresCronjob) {
        void batchUpdateScore({collection, inactive: true});
      }
    });
  }
});
