import { batchUpdateScore } from './updateScores';
import { getVoteableCollections } from '@/server/collections/allCollections';
import { addCronJob } from './cron/cronUtil';
import { backgroundTask } from './utils/backgroundTask';

// Setting voting.scoreUpdateInterval removed and replaced with a hard-coded
// interval because the time-parsing library we use can't handle numbers of
// seconds >= 60; rather than treat them as minutes (like you'd expect), it
// treats intervals like "every 100 seconds" as a syntax error.

export const updateScoreActiveDocumentsCron = addCronJob({
  name: 'updateScoreActiveDocuments',
  interval: `every 30 seconds`,
  job() {
    getVoteableCollections().forEach(collection => {
      const options = collection.options.voteable!;
      if (options.timeDecayScoresCronjob) {
        backgroundTask(batchUpdateScore({collection}));
      }
    });
  }
});
export const updateScoreInactiveDocumentsCron = addCronJob({
  name: 'updateScoreInactiveDocuments',
  interval: 'every 24 hours',
  job() {
    getVoteableCollections().forEach(collection => {
      const options = collection.options.voteable!;
      if (options.timeDecayScoresCronjob) {
        backgroundTask(batchUpdateScore({collection, inactive: true}));
      }
    });
  }
});
