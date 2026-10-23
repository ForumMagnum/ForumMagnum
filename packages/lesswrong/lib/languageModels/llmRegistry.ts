/**
 * The models LessWrong runs, grouped into families. Each family has one
 * account (a user whose `llmFamily` is the family's name), created by
 * `createLlmFamilyAccounts`, which posts that family's comment replies.
 * Versions are listed newest first; retired versions can no longer be run,
 * but their past runs and replies remain.
 */
export interface LlmFamily {
  /** Display name of the family's account, and what users type, e.g. "Opus" */
  name: string
  /** Username and slug of the family's account */
  accountSlug: string
  /** Newest first */
  versions: LlmVersion[]
}

export interface LlmVersion {
  /** Shown in mentions, on replies and on run pages, e.g. "Opus5.5" */
  name: string
  /** Shown in the mention menu, e.g. "Claude Opus 5.5" */
  fullName: string
  /** Vercel AI Gateway model ID */
  gatewayModelId: string
  retired: boolean
}

export interface LlmFamilyVersion {
  family: LlmFamily
  version: LlmVersion
}

export const LLM_FAMILIES: LlmFamily[] = [
  {
    name: "Opus",
    accountSlug: "opus",
    versions: [{ name: "Opus5.5", fullName: "Claude Opus 5.5", gatewayModelId: "anthropic/claude-opus-5.5", retired: false }],
  },
  {
    name: "Fable",
    accountSlug: "fable",
    versions: [{ name: "Fable5.1", fullName: "Claude Fable 5.1", gatewayModelId: "anthropic/claude-fable-5.1", retired: false }],
  },
  {
    name: "ChatGPT-Sol",
    accountSlug: "chatgpt-sol",
    versions: [{ name: "ChatGPT-Sol6.1", fullName: "GPT-6.1 Sol", gatewayModelId: "openai/gpt-6.1-sol", retired: false }],
  },
  {
    name: "Gemini",
    accountSlug: "gemini",
    versions: [{ name: "Gemini4-Argon", fullName: "Gemini 4 Argon", gatewayModelId: "google/gemini-4-argon", retired: false }],
  },
];

export function getLlmFamilyByName(name: string): LlmFamily | undefined {
  return LLM_FAMILIES.find((family) => family.name === name);
}

export function getLlmFamilyBySlug(accountSlug: string): LlmFamily | undefined {
  return LLM_FAMILIES.find((family) => family.accountSlug === accountSlug);
}

/** The family's newest version that isn't retired */
export function getLatestLlmVersion(family: LlmFamily): LlmVersion | undefined {
  return family.versions.find((version) => !version.retired);
}
