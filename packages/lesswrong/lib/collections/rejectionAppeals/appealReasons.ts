export interface AppealReason {
  id: string;
  label: string;
  affirmations: string[];
}

// TODO: placeholder reasons and affirmations, to be finalized with the moderation team
export const APPEAL_REASONS: AppealReason[] = [
  {
    id: "llmWritten",
    label: "LLM-written or LLM-edited content",
    affirmations: [
      "I did not use LLMs to write, edit, or otherwise produce my content.",
      "I understand that \"an LLM wrote it, but English is my second language / I have ADHD / etc.\" does not merit an exception.",
    ],
  },
  {
    id: "aiConsciousness",
    label: "New user writing about AI consciousness, sentience, or similar",
    affirmations: [
      "I am not a new user writing about AI consciousness, AI sentience, or similar topics.",
    ],
  },
  {
    id: "llmResearch",
    label: "LLM-conducted research into AI",
    affirmations: [
      "This is not an LLM-conducted experiment into AI that fails to explain why it is particularly interesting or relevant.",
    ],
  },
  {
    id: "other",
    label: "Other",
    affirmations: [],
  },
];
