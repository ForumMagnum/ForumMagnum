import { anthropicApiKey } from "@/lib/instanceSettings";
import Anthropic from "@anthropic-ai/sdk";

const getAnthropicClientOrThrow = (() => {
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

