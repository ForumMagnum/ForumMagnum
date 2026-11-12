import gql from "graphql-tag";
import { unstable_cache } from "next/cache";
import { z } from "zod";
import { captureException } from "@/lib/sentryWrapper";

export const llmModelGraphQLTypeDefs = gql`
  extend type Query {
    LlmModelOptions: [String!]!
  }
`;

// An unauthenticated list of every model OpenRouter serves, updated as new
// models ship, so that these suggestions don't need hand-editing.
const OPENROUTER_MODELS_URL = "https://openrouter.ai/api/v1/models";

const modelSchema = z.object({
  id: z.string(),
  name: z.string(),
  architecture: z.object({ output_modalities: z.array(z.string()) }),
});

// Per-entry, so that one malformed model doesn't discard the whole catalog.
const modelsResponseSchema = z.object({ data: z.array(modelSchema.nullable().catch(null)) });

type OpenRouterModel = z.infer<typeof modelSchema>;

// OpenRouter names models "Anthropic: Claude Opus 4.5"; the provider prefix is
// redundant with the model name in ~all cases.
function getDisplayName(model: OpenRouterModel): string {
  const separatorIndex = model.name.indexOf(": ");
  return separatorIndex >= 0 ? model.name.slice(separatorIndex + 2) : model.name;
}

function getProvider(model: OpenRouterModel): string {
  return model.id.split("/")[0];
}

// OpenRouter returns models newest-first, so interleaving these three puts the
// latest Claude, GPT and Grok at the top of the suggestions.
const FEATURED_PROVIDERS = ["anthropic", "openai", "x-ai"];

function featuredModelsFirst(models: OpenRouterModel[]): OpenRouterModel[] {
  const featuredByProvider = FEATURED_PROVIDERS.map(
    (provider) => models.filter((model) => getProvider(model) === provider)
  );
  const mostFromOneProvider = Math.max(0, ...featuredByProvider.map((provider) => provider.length));
  const featured: OpenRouterModel[] = [];
  for (let index = 0; index < mostFromOneProvider; index++) {
    featured.push(...featuredByProvider.map((provider) => provider[index]).filter((model) => !!model));
  }
  return [...featured, ...models.filter((model) => !FEATURED_PROVIDERS.includes(getProvider(model)))];
}

function isSuggestableModel(model: OpenRouterModel): boolean {
  // Ids like "anthropic/claude-opus-4.5:thinking" are variants of a model already
  // listed under its base id.
  const { output_modalities } = model.architecture;
  return !model.id.includes(":") && output_modalities.length === 1 && output_modalities[0] === "text";
}

// Returns an empty list rather than throwing, so a failed fetch gets cached too
// and an OpenRouter outage doesn't mean an outbound fetch per request.
async function fetchLlmModelOptions(): Promise<string[]> {
  try {
    const response = await fetch(OPENROUTER_MODELS_URL, { signal: AbortSignal.timeout(5000) });
    if (!response.ok) {
      throw new Error(`OpenRouter models API responded with status ${response.status} - ${response.statusText}`);
    }
    const { data } = modelsResponseSchema.parse(await response.json());
    const models = data.flatMap((model) => model && isSuggestableModel(model) ? [model] : []);
    return [...new Set(featuredModelsFirst(models).map(getDisplayName))];
  } catch (error) {
    captureException(error);
    return [];
  }
}

const fetchCachedLlmModelOptions = unstable_cache(fetchLlmModelOptions, undefined, { revalidate: 60 * 60 * 12 });

export const llmModelGraphQLQueries = {
  async LlmModelOptions(root: void, args: void, context: ResolverContext) {
    return fetchCachedLlmModelOptions();
  },
};
