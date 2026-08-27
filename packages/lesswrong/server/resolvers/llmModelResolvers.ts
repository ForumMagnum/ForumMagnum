import gql from "graphql-tag";
import { unstable_cache } from "next/cache";
import { FALLBACK_LLM_MODEL_OPTIONS } from "@/lib/llmModelOptions";

export const llmModelGraphQLTypeDefs = gql`
  extend type Query {
    LlmModelOptions: [String!]!
  }
`;

/**
 * OpenRouter publishes an unauthenticated list of the models it serves, which
 * covers every major lab and is kept up to date as new models ship. We use it
 * so that the autocomplete on LLM content blocks doesn't need hand-editing
 * every time a new model comes out.
 */
const OPENROUTER_MODELS_URL = "https://openrouter.ai/api/v1/models";

/** Providers we suggest, in the order they're offered. */
const SUGGESTED_PROVIDERS = ["anthropic", "openai", "google", "x-ai", "deepseek", "moonshotai", "meta-llama", "qwen", "mistralai"];

const MODELS_PER_PROVIDER = 8;

const REVALIDATE_SECONDS = 60 * 60 * 12;

const FETCH_TIMEOUT_MS = 5000;

interface OpenRouterModel {
  id: string
  name: string
  created: number
  architecture: { output_modalities: string[] }
}

function isOpenRouterModel(model: unknown): model is OpenRouterModel {
  if (typeof model !== "object" || model === null) return false;
  const { id, name, created, architecture } = model as Record<string, unknown>;
  if (typeof id !== "string" || typeof name !== "string" || typeof created !== "number") return false;
  if (typeof architecture !== "object" || architecture === null) return false;
  const { output_modalities } = architecture as Record<string, unknown>;
  return Array.isArray(output_modalities) && output_modalities.every((modality) => typeof modality === "string");
}

/**
 * OpenRouter names models as "Anthropic: Claude Opus 4.5"; we want just the
 * model, since the provider is implied by the name in ~all cases.
 */
function getDisplayName(model: OpenRouterModel): string {
  const separatorIndex = model.name.indexOf(": ");
  return separatorIndex >= 0 ? model.name.slice(separatorIndex + 2) : model.name;
}

function getProvider(model: OpenRouterModel): string {
  return model.id.split("/")[0];
}

function isSuggestableModel(model: OpenRouterModel): boolean {
  // Ids like "anthropic/claude-opus-4.5:thinking" are variants of a model
  // that's already listed under its base id. Models that emit images or audio
  // aren't what an LLM content block holds.
  const { output_modalities } = model.architecture;
  return !model.id.includes(":") && output_modalities.length === 1 && output_modalities[0] === "text";
}

function selectModelOptions(models: OpenRouterModel[]): string[] {
  const options = SUGGESTED_PROVIDERS.flatMap((provider) => models
    .filter((model) => isSuggestableModel(model) && getProvider(model) === provider)
    .sort((a, b) => b.created - a.created)
    .slice(0, MODELS_PER_PROVIDER)
    .map(getDisplayName)
  );
  return [...new Set(options)];
}

async function fetchLlmModelOptions(): Promise<string[]> {
  const response = await fetch(OPENROUTER_MODELS_URL, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
  if (!response.ok) {
    throw new Error(`OpenRouter models API responded with status ${response.status} - ${response.statusText}`);
  }
  const body: unknown = await response.json();
  const models = (typeof body === "object" && body !== null && "data" in body && Array.isArray(body.data))
    ? body.data.filter(isOpenRouterModel)
    : [];
  if (!models.length) {
    throw new Error("OpenRouter models API returned no usable models");
  }
  return selectModelOptions(models);
}

const fetchCachedLlmModelOptions = unstable_cache(fetchLlmModelOptions, undefined, { revalidate: REVALIDATE_SECONDS });

export const llmModelGraphQLQueries = {
  async LlmModelOptions(root: void, args: void, context: ResolverContext) {
    try {
      return await fetchCachedLlmModelOptions();
    } catch (error) {
      console.error("Failed to fetch LLM model options from OpenRouter", error);
      return FALLBACK_LLM_MODEL_OPTIONS;
    }
  },
};
