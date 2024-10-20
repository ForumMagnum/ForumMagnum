import { anthropicApiKey } from "@/lib/instanceSettings";
import '@anthropic-ai/sdk/shims/node';
import Anthropic from "@anthropic-ai/sdk";

export const getAnthropicClientOrThrow = (() => {
  let client: Anthropic;

  return () => {
    if (!client) {
      const apiKey = anthropicApiKey.get()

      if (!apiKey) {
        throw new Error('Missing api key when initializing Anthropic client!');
      }
      
      // TODO - pull out client options like region to db settings?
      client = new Anthropic({apiKey})
    }

    return client;
  };
})();

export const getAnthropicPromptCachingClientOrThrow = () => {
  const baseClient = getAnthropicClientOrThrow();
  return new Anthropic.Beta.PromptCaching(baseClient);
};
