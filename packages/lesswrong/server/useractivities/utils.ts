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

// TODO add tests for this
export const calculateActivityFactor = (activityArray: number[] | undefined, halfLifeHours: number): number => {
  if (!activityArray) return 0; // if user has not visited recently, activity factor is 0

  const expandedFactors: number[] = expandActivityInfluence(activityArray, 11);
  const decayFactor = Math.log(2) / halfLifeHours;
  const rawActivityFactor = expandedFactors.map((n, idx) => n * Math.exp(-decayFactor * idx)).reduce((a, b) => a + b, 0);
  const normalisationFactor = 1 / (1 - Math.exp(-decayFactor));
  return rawActivityFactor / normalisationFactor;
}
