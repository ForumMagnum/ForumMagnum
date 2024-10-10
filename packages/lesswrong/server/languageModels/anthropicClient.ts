import { anthropicApiKey } from "@/lib/instanceSettings";
import '@anthropic-ai/sdk/shims/node';
import Anthropic from "@anthropic-ai/sdk";

export const getAnthropicClientOrThrow = ((customApiKey?: string) => {
  let client: Anthropic;

  return (customApiKey?: string) => {
    if (!client) {
      const apiKey = customApiKey ?? anthropicApiKey.get()

      if (!apiKey) {
        throw new Error('Missing api key when initializing Anthropic client!');
      }
      
      // TODO - pull out client options like region to db settings?
      client = new Anthropic({apiKey})
    }

    return client;
  };
})();

export const getAnthropicPromptCachingClientOrThrow = (customApiKey?: string) => {
  const baseClient = getAnthropicClientOrThrow(customApiKey);
  return new Anthropic.Beta.PromptCaching(baseClient);
};
