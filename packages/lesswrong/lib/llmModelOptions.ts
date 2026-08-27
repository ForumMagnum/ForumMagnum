/**
 * Autocomplete suggestions for the model name on an LLM content block. The
 * live list is fetched from OpenRouter (see `llmModelResolvers.ts`); this is
 * the fallback used before that query resolves, and if it fails.
 */
export const FALLBACK_LLM_MODEL_OPTIONS = [
  'Claude Opus 4.7',
  'Claude Opus 4.6',
  'Claude Opus 4.5',
  'Claude Opus 3',
  'Claude Sonnet 4.6',
  'Claude Sonnet 4.5',
  'Claude Sonnet 4',
  'Claude Haiku 4.5',
  'Claude Haiku 3.5',
  'GPT-5.4',
  'GPT-5.2',
  'GPT-5.1',
  'GPT-4.5',
  'Gemini 3.1 Pro Preview',
  'Gemini 3.0 Flash Preview',
  'Gemini 2.5 Pro',
  'Grok 4.1',
  'DeepSeek v3.2',
  'Kimi K2.5',
];
