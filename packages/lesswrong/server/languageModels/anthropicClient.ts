import { anthropicApiKey } from "@/lib/instanceSettings";
import '@anthropic-ai/sdk/shims/node';
import Anthropic from "@anthropic-ai/sdk";
import { createHash } from 'crypto';

export const getAnthropicClientOrThrow = (() => {
  let keyClientMap = new Map<string, Anthropic>();

  return (customApiKey?: string) => {
    const apiKey = customApiKey ?? anthropicApiKey.get();
    if (!apiKey) {
      throw new Error('Missing api key when initializing Anthropic client!');
    }

    // Hash the key to avoid exposing the actual key in logs, if that ever happens by accident
    const hashedKey = createHash('sha256').update(apiKey).digest('hex');
    let client = keyClientMap.get(hashedKey);
    if (!client) {
      client = new Anthropic({ apiKey });
      keyClientMap.set(hashedKey, client);
    }

    return client;
  };
})();

export const getAnthropicPromptCachingClientOrThrow = (customApiKey?: string) => {
  const baseClient = getAnthropicClientOrThrow(customApiKey);
  return new Anthropic.Beta.PromptCaching(baseClient);
};
