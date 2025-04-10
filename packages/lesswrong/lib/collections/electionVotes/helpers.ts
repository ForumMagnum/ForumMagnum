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
export const VOTING_DEADLINE = new Date("2023-12-15T23:59:59-12:00");

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

export const validateVote = ({data}: {data: CreateElectionVoteDataInput | UpdateElectionVoteDataInput}) => {
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

export const validateCompareState = ({data}: {data: CreateElectionVoteDataInput | UpdateElectionVoteDataInput}) => {
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
  const naiveString = num.toString();
  const definitelyNotScientificNotation = num.toFixed(maxLength).replace(/\.?0+$/, "");

  if (naiveString.includes("e")) return definitelyNotScientificNotation;
  // The definitelyNotScientificNotation version sometimes results in weird rounding
  // (e.g. 11.11.toFixed(10) = "11.109999999999999") so prefer not using it if the simple
  // toString version doesn't result in e.g. 1e9
  if (naiveString.length <= definitelyNotScientificNotation.length) return naiveString;
  return definitelyNotScientificNotation;
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

  // Normalize (to 100) and round to 2 sf
  const total = Object.values(vote).reduce((sum, value) => sum + value, 0);
  const normalizedVote = Object.fromEntries(
    Object.entries(vote).map(([id, value]) => [id, Number(((value / total) * 100).toPrecision(2))])
  );

  return normalizedVote;
}

export const ELECTION_EFFECT_QUESTION = "Did you change your donation priorities as a result of the Forum's Giving Season activities?"
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
    label: "Totally changed my donation priorities",
  },
]

export const ELECTION_NOTE_QUESTION = "Why did you vote the way you did?"

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
export const submissionCommentsToFormState = (submissionComments?: SubmissionComments): { electionEffect: string; note: string } => {
  return {
    electionEffect: submissionComments?.rawFormValues.electionEffect ?? "",
    note: submissionComments?.rawFormValues.note ?? "",
  }
}

/** Approximately the time the election was accounced: https://forum.effectivealtruism.org/posts/x2KfyNe8oPR4dqGkf/ea-forum-plans-for-giving-season-2023 */
const votingAccountCreationCutoff = new Date("2023-10-23T19:00:00Z");

export const userCanVoteInDonationElection = (
  user: UsersCurrent | DbUser | null,
) =>
  !!user && new Date(user.createdAt).getTime() < votingAccountCreationCutoff.getTime()
