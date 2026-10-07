/**
 * Models the supermod moderation agent can run on, as Vercel AI Gateway model
 * strings. Shared by the chat route (validation + streamText) and the panel's
 * model switcher. Keep the ids in sync with what the gateway supports.
 */
export interface SupermodAgentModelOption {
  id: string;
  label: string;
  /** Whether the gateway accepts the anthropic `thinking` provider option for this model */
  supportsThinking: boolean;
}

export const supermodAgentModels: SupermodAgentModelOption[] = [
  { id: "anthropic/claude-fable-5.1", label: "Fable 5.1", supportsThinking: false },
  { id: "anthropic/claude-opus-5", label: "Opus 5", supportsThinking: false },
  { id: "anthropic/claude-fable-5", label: "Fable 5", supportsThinking: false },
  { id: "anthropic/claude-sonnet-4-6", label: "Sonnet 4.6", supportsThinking: true },
  { id: "anthropic/claude-haiku-4-5", label: "Haiku 4.5", supportsThinking: false },
];

export function supermodAgentModelSupportsThinking(model: string): boolean {
  return supermodAgentModels.find((option) => option.id === model)?.supportsThinking ?? false;
}

export const defaultSupermodAgentModel = "anthropic/claude-fable-5.1";

export function isSupportedSupermodAgentModel(model: string): boolean {
  return supermodAgentModels.some((option) => option.id === model);
}
