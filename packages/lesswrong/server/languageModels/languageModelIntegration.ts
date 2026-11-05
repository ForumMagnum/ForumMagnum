// eslint-disable-next-line no-restricted-imports
import type OpenAI from "openai";
import { openAIOrganizationId } from '../databaseSettings';

let openAIApi: OpenAI|null = null;
export async function getOpenAI(): Promise<OpenAI|null> {
  if (!openAIApi){
    const apiKey = (process.env.private_languageModels_openai_apiKey ?? null);
    const organizationId = openAIOrganizationId;
    
    if (apiKey) {
      const { OpenAI } = await import('openai');
      openAIApi = new OpenAI({
        apiKey,
        organization: organizationId ?? undefined,
      });
    }
  }
  return openAIApi;
}

export function isOpenAIAPIEnabled() {
  const apiKey = (process.env.private_languageModels_openai_apiKey ?? null);
  return !!apiKey;
}
