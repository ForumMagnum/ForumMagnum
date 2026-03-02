import type { ReactBallotAxis, ReactBallotStandaloneReaction } from './votingSystemTypes';


export const reactBallotAxes: ReactBallotAxis[] = [
  { name: "truth", scoreLabel: "Truth", goodLabel: "True", badLabel: "False" },
  { name: "aim", scoreLabel: "Aim", goodLabel: "Hits the Mark", badLabel: "Misses the Point" },
  { name: "clarity", scoreLabel: "Clarity", goodLabel: "Clear", badLabel: "Muddled" },
  { name: "seeking", scoreLabel: "Seeking", goodLabel: "Seeks Truth", badLabel: "Seeks Conflict" },
];

export const reactBallotStandaloneReactions: ReactBallotStandaloneReaction[] = [
  { name: "skepticism", label: "Skepticism", icon: "🤨" },
  { name: "enthusiasm", label: "Enthusiasm", icon: "🎉" },
  { name: "empathy", label: "Empathy", icon: "❤️" },
  { name: "surprise", label: "Surprise", icon: "😮" },
];

