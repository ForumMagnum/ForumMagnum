export interface LlmFamily {
  name: string
  accountSlug: string
  versions: LlmVersion[]
}

export interface LlmVersion {
  name: string
  fullName: string
  gatewayModelId: string
  retired: boolean
}

export interface LlmFamilyVersion {
  family: LlmFamily
  version: LlmVersion
}

export const LLM_FAMILIES: LlmFamily[] = [
  {
    name: "Claude Opus",
    accountSlug: "opus",
    versions: [{ name: "Opus5.5", fullName: "Claude Opus 5.5", gatewayModelId: "anthropic/claude-opus-5.5", retired: false }],
  },
  {
    name: "Claude Fable",
    accountSlug: "fable",
    versions: [{ name: "Fable5.1", fullName: "Claude Fable 5.1", gatewayModelId: "anthropic/claude-fable-5.1", retired: false }],
  },
  {
    name: "ChatGPT Sol",
    accountSlug: "chatgpt-sol",
    versions: [{ name: "ChatGPT-Sol6.1", fullName: "GPT-6.1 Sol", gatewayModelId: "openai/gpt-6.1-sol", retired: false }],
  },
  {
    name: "ChatGPT Astra",
    accountSlug: "chatgpt-astra",
    versions: [{ name: "ChatGPT-Astra6", fullName: "GPT-6 Astra", gatewayModelId: "openai/gpt-6-astra", retired: false }],
  },
  {
    name: "Gemini",
    accountSlug: "gemini",
    versions: [{ name: "Gemini4-Argon", fullName: "Gemini 4 Argon", gatewayModelId: "google/gemini-4-argon", retired: false }],
  },
  {
    name: "Grok",
    accountSlug: "grok",
    versions: [{ name: "Grok4.7", fullName: "Grok 4.7", gatewayModelId: "spacexai/grok-4.7", retired: false }],
  },
];

export function getLlmFamilyBySlug(accountSlug: string): LlmFamily | undefined {
  return LLM_FAMILIES.find((family) => family.accountSlug === accountSlug);
}

export function getLatestLlmVersion(family: LlmFamily): LlmVersion | undefined {
  return family.versions.find((version) => !version.retired);
}

export function getLlmVersionFullName(versionName: string): string {
  const version = LLM_FAMILIES.flatMap((family) => family.versions).find(({ name }) => name === versionName);
  if (!version) {
    throw new Error(`Unknown model version ${versionName}`);
  }
  return version.fullName;
}
