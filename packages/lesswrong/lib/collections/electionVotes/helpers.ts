/**
 * Each entry maps an *ordered pair* of candidate ids concatenated together (e.g. "ADoKFRmPkWbmyWwGw-cF8iwCmwFjbmCqYkQ") to
 * the relative value of the candidates. If AtoB is true, then this means the first candidate is `multiplier` times as
 * valuable as the second candidate (and vice versa if AtoB is false).
 *
 * CompareStateUI allows strings because this is needed to allow intermediate values like "0." as the user is typing.
 */
export type CompareStateUI = Record<string, {multiplier: number | string, AtoB: boolean}>;
/**
 * Each entry maps an *ordered pair* of candidate ids concatenated together (e.g. "ADoKFRmPkWbmyWwGw-cF8iwCmwFjbmCqYkQ") to
 * the relative value of the candidates. If AtoB is true, then this means the first candidate is `multiplier` times as
 * valuable as the second candidate (and vice versa if AtoB is false).
 */
export type CompareState = Record<string, {multiplier: number, AtoB: boolean}>;

/** Latest midnight on 2023-12-15 */
const VOTING_DEADLINE = new Date("2023-12-15T23:59:59-12:00");

export const isPastVotingDeadline = () => new Date() > VOTING_DEADLINE;

export const getCompareKey = (candidate1: ElectionCandidateBasicInfo, candidate2: ElectionCandidateBasicInfo) => {
  return `${candidate1._id}-${candidate2._id}`;
}

export const getInitialCompareState = (candidatePairs: ElectionCandidateBasicInfo[][]): CompareStateUI => {
  return Object.fromEntries(
    candidatePairs.map(([candidate, otherCandidate]) => {
      const key = getCompareKey(candidate, otherCandidate);
      return [key, {multiplier: 1, AtoB: true}];
    })
  );
}

export const validateVote = ({data}: {data: Partial<DbElectionVote>}) => {
  if (data.vote && typeof data.vote !== 'object') {
    throw new Error("Invalid vote value");
  }
  for (let key in data.vote) {
    if (typeof data.vote[key] !== 'number' && data.vote[key] !== null) {
      throw new Error("Invalid vote value");
    }
    if (data.vote[key] !== null && (data.vote[key] < 0 || !Number.isFinite(data.vote[key]))) {
      throw new Error("Invalid vote value: allocation cannot be negative, NaN, or Infinity");
    }
  }
  return data.vote;
};

export const validateCompareState = ({data}: {data: Partial<DbElectionVote>}) => {
  const compareState: CompareState = data.compareState;

  for (let key in compareState) {
    const { multiplier, AtoB } = compareState[key];
    if (typeof multiplier !== 'number' || multiplier <= 0 || !Number.isFinite(multiplier)) {
      throw new Error("Invalid compareState value: multiplier must be a positive finite number");
    }
    if (typeof AtoB !== 'boolean') {
      throw new Error("Invalid compareState value: AtoB must be a boolean");
    }
  }
  return compareState;
};

/**
 * Convert a number to a string in a way that doesn't use scientific notation, so that the
 * result comes out the same as what the user entered.
 */
export const numberToEditableString = (num: number, maxLength = 10): string => {
  return num.toFixed(maxLength).replace(/\.?0+$/, "");
}

export const convertCompareStateToVote = (compareState: CompareState): Record<string, number> => {
  const pairs = Object.keys(compareState).map(key => {
    const [candidate1Id, candidate2Id] = key.split("-");
    const {multiplier, AtoB} = compareState[key];
    const secondTimesFirstMultiplier = AtoB ? 1 / multiplier : multiplier;
    return [candidate1Id, candidate2Id, secondTimesFirstMultiplier];
  }) as [string, string, number][];

  // Process them in an order like [[A, B, x], [B, C, y], [C, D, z]], and throw an error if this ordering isn't possible
  // A (the head id) appears only once, and in the first position. D (the tail id) appears only once, and in the last position.
  const headIds = pairs.map(([headId]) => headId)
  const tailIds = pairs.map(([, tailId]) => tailId)
  const allExpectedIds = new Set([...headIds, ...tailIds]);

  const headId = headIds.find(id => !tailIds.includes(id));
  const tailId = tailIds.find(id => !headIds.includes(id));

  if (!headId || !tailId) {
    throw new Error("No unique head and tail ids found");
  }

  const vote = {
    [headId]: 1,
  };

  let currentId = headId;
  while (currentId !== tailId) {
    // Find the pair based on the id of the first element
    const pair = pairs.find(([id]) => id === currentId);
    if (!pair) {
      throw new Error("No next pair found");
    }
    // Note: firstId == currentId here
    const [firstId, secondId, secondTimesFirstMultiplier] = pair;

    if (vote[secondId]) {
      throw new Error("Second id already found");
    }

    const firstValue = vote[firstId];
    const secondValue = firstValue * secondTimesFirstMultiplier;
    vote[secondId] = secondValue;
    currentId = secondId;
  }

  // Assert all the ids are present
  const voteIds = Object.keys(vote);
  if (voteIds.length !== allExpectedIds.size || !voteIds.every(id => allExpectedIds.has(id))) {
    throw new Error("Vote ids don't match expected ids");
  }

  // Normalize (to 1) and round to 4 sf
  const total = Object.values(vote).reduce((sum, value) => sum + value, 0);
  const normalizedVote = Object.fromEntries(
    Object.entries(vote).map(([id, value]) => [id, Number((value / total).toPrecision(4))])
  );

  return normalizedVote;
}

export const ELECTION_EFFECT_QUESTION = "How much did you change your mind about where to donate and/or how to vote, as a result of the Donation Election or other Giving Season activities?"
export const ELECTION_EFFECT_OPTIONS = [
  {
    value: "noChange",
    label: "Didn’t change my donation priorities",
  },
  {
    value: "smChange",
    label: "Changed my donation priorities a bit",
  },
  {
    value: "lgChange",
    label: "Noticeably changed my donation priorities",
  },
  {
    value: "xlChange",
    label: "Totally changed my donation priorities ",
  },
]

export const ELECTION_NOTE_QUESTION = "Share a note about your vote, which might get shared (anonymously) in the public writeup of the results"

export type SubmissionComments = {
  rawFormValues: {
    electionEffect: string;
    note: string;
  };
  questions: {
    question: string;
    answer: string;
    answerValue?: string;
  }[];
}

/**
 * Convert the values we get from the UI in the submission form to a json blob that can be stored in
 * the database
 */
export const formStateToSubmissionComments = ({ electionEffect, note }: { electionEffect: string; note: string }): SubmissionComments => {
  return {
    rawFormValues: {
      electionEffect,
      note,
    },
    questions: [
      {
        question: ELECTION_EFFECT_QUESTION,
        answer: electionEffect,
        answerValue: ELECTION_EFFECT_OPTIONS.find(({ value }) => value === electionEffect)?.label,
      },
      {
        question: ELECTION_NOTE_QUESTION,
        answer: note,
      },
    ]
  }
};

/*
 * Convert the json blob we get from the database to the values we need to populate the submission form
 */
export const submissionCommentsToFomState = (submissionComments?: SubmissionComments): { electionEffect: string; note: string } => {
  return {
    electionEffect: submissionComments?.rawFormValues.electionEffect ?? "",
    note: submissionComments?.rawFormValues.note ?? "",
  }
}
