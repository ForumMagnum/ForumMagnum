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
  /**
   * The basic idea of this function is to add up the _days_ a user was active, with an exponential
   * decay factor as you go further into the past, and then normalise to make this between 0 and 1.
   *
   * Bucketing activity by day has the problem of creating big jumps based on the current time and where activity
   * happens to fall. E.g. if a user was active 23, 24, and 25 hours ago, this would count as being active for the
   * 2 previous days.
   *
   * The solution to this here is to use activity by hour but "expand the influence" of a single
   * hour of activity to a number of hours around it. For example by expaning the influence of a single hour by 1 each
   * side an activity array of [0, 0, 1, 1, 0, 0, 0, 1] becomes [0, 1, 1, 1, 1, 0, 1, 1]. This makes it so we are
   * effectively measuring activity by day but without any big jumps.
   */
  if (!activityArray) return 0; // if user has not visited recently, activity factor is 0

  const expandedFactors: number[] = expandActivityInfluence(activityArray, 11);
  const decayFactor = Math.log(2) / halfLifeHours;
  const rawActivityFactor = expandedFactors.map((n, idx) => n * Math.exp(-decayFactor * idx)).reduce((a, b) => a + b, 0);
  const normalisationFactor = 1 / (1 - Math.exp(-decayFactor));
  return rawActivityFactor / normalisationFactor;
}
