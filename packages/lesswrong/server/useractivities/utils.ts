/* See lib/collections/useractivities/collection.ts for a high-level overview */
import sum from 'lodash/sum';

function expandActivityInfluence(input: number[], influenceHours: number): number[] {
  const output: number[] = new Array(input.length).fill(0);
  
  for (let i = 0; i < input.length; i++) {
    if (input[i] === 1) {
      const start = Math.max(0, i - influenceHours);
      const end = Math.min(input.length, i + influenceHours + 1);
      
      for (let j = start; j < end; j++) {
        output[j] = 1;
      }
    }
  }
  
  return output;
}

/**
 * Calculate an "activity factor" between 0 and 1 for a user, based on their recent activity.
 * An activity factor of 0 means the user has not visited recently, and 1 means they visit every day
 *
 * @param activityArray An array of 0s and 1s for every hour in reverse chronological order
 * (up to some limit), indicating whether the user was active in that hour. e.g. [0, 0, 1, 0, 1]
 * means the user was active 3 hours ago and 5 hours ago
 * @param halfLifeHours The number of hours after which the influence of a visit is halved
 */
export const calculateActivityFactor = (activityArray: number[] | undefined, halfLifeHours: number): number => {
  if (!activityArray) return 0; // if user has not visited recently, activity factor is 0

  const expandedActivityArray: number[] = expandActivityInfluence(activityArray, 11);
  const decayConstant = Math.log(2) / halfLifeHours;
  const rawActivityFactor = sum(expandedActivityArray.map((n, idx) => n * Math.exp(-decayConstant * idx)))
  const normalisationConstant = 1 / (1 - Math.exp(-decayConstant));
  return rawActivityFactor / normalisationConstant;
}
