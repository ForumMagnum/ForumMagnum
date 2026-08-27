import gql from "graphql-tag";
import { unstable_cache } from "next/cache";
import { z } from "zod";

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

const modelSchema = z.object({
  id: z.string(),
  name: z.string(),
  architecture: z.object({ output_modalities: z.array(z.string()) }),
});

const modelsResponseSchema = z.object({ data: z.array(modelSchema) });

type OpenRouterModel = z.infer<typeof modelSchema>;

/**
 * OpenRouter names models as "Anthropic: Claude Opus 4.5"; we want just the
 * model, since the provider is implied by the name in ~all cases.
 */
function getDisplayName(model: OpenRouterModel): string {
  const separatorIndex = model.name.indexOf(": ");
  return separatorIndex >= 0 ? model.name.slice(separatorIndex + 2) : model.name;
}

function isSuggestableModel(model: OpenRouterModel): boolean {
  // Ids like "anthropic/claude-opus-4.5:thinking" are variants of a model
  // that's already listed under its base id. Models that emit images or audio
  // aren't what an LLM content block holds.
  const { output_modalities } = model.architecture;
  return !model.id.includes(":") && output_modalities.length === 1 && output_modalities[0] === "text";
}

/**
 * Returns an empty list rather than throwing, so that a failed fetch gets
 * cached too; otherwise every request during an OpenRouter outage would make
 * its own outbound fetch. The list is only autocomplete for a free-text field,
 * so having none of it for a while is survivable.
 */
async function fetchLlmModelOptions(): Promise<string[]> {
  try {
    const response = await fetch(OPENROUTER_MODELS_URL, { signal: AbortSignal.timeout(5000) });
    if (!response.ok) {
      throw new Error(`OpenRouter models API responded with status ${response.status} - ${response.statusText}`);
    }
    const { data } = modelsResponseSchema.parse(await response.json());
    return [...new Set(data.filter(isSuggestableModel).map(getDisplayName))];
  } catch (error) {
    console.error("Failed to fetch LLM model options from OpenRouter", error);
    return [];
  }
}

const fetchCachedLlmModelOptions = unstable_cache(fetchLlmModelOptions, undefined, { revalidate: 60 * 60 * 12 });

export const llmModelGraphQLQueries = {
  async LlmModelOptions(root: void, args: void, context: ResolverContext) {
    try {
      return await fetchCachedLlmModelOptions();
    } catch (error) {
      // unstable_cache throws if called outside of a request scope, eg from a script.
      console.error("Failed to read cached LLM model options", error);
      return [];
    }
  },
};
