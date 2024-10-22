import type { ChatModel as OpenAIModel, ChatCompletionSystemMessageParam as OpenAISystemMessage } from 'openai/resources/chat';
import type { ChatCompletionUserMessageParam as OpenAIUserMessage, ChatCompletionAssistantMessageParam as OpenAIAssistantMessage, ChatCompletionCreateParamsBase as OpenAISendMessagesParams } from 'openai/resources/chat/completions';
import type { Model as AnthropicModel } from '@anthropic-ai/sdk/resources/messages';
import type { MessageCreateParamsBase as AnthropicSendMessagesParams, PromptCachingBetaMessageParam as AnthropicMessage, PromptCachingBetaTextBlockParam as AnthropicMessageTextBlock } from '@anthropic-ai/sdk/resources/beta/prompt-caching/messages';

import { getOpenAI } from './languageModelIntegration';
import { getAnthropicPromptCachingClientOrThrow } from './anthropicClient';

export interface SendOpenAIMessages {
  provider: 'openai';
  model: OpenAIModel;
  messages: OpenAISendMessagesParams['messages'];
  maxTokens: OpenAISendMessagesParams['max_tokens'];
  system?: OpenAISystemMessage;
}

export interface SendAnthropicMessages {
  provider: 'anthropic';
  model: AnthropicModel;
  messages: Array<Omit<AnthropicMessage, 'content'> & { content: string | AnthropicMessageTextBlock[] }>;
  maxTokens: AnthropicSendMessagesParams['max_tokens'];
  system?: AnthropicSendMessagesParams['system'];
  customApiKey?: string;
}

export type SendLLMMessagesArgs = SendOpenAIMessages | SendAnthropicMessages;

export async function sendMessagesToLlm<T extends SendLLMMessagesArgs>(args: T) {
  if (args.provider === 'openai') {
    const client = await getOpenAI();
    if (!client) {
      throw new Error(`Couldn't get OpenAI Client!`);
    }

    const { maxTokens, model, messages, system } = args;

    const allMessages = [...messages];
    if (system) {
      allMessages.unshift(system);
    }

    const response = await client.chat.completions.create({
      model,
      max_tokens: maxTokens,
      messages: allMessages,
    });

    const [firstContentBlock] = response.choices;

    if (!firstContentBlock) {
      throw new Error('Response from OpenAI has no content blocks!');
    }

    return firstContentBlock.message.content;
  }
  
  const client = getAnthropicPromptCachingClientOrThrow(args.customApiKey);

  const { maxTokens, messages, model, system } = args;

  const response = await client.messages.create({
    model,
    max_tokens: maxTokens,
    messages,
    system
  });

  const [firstContentBlock] = response.content;

  if (!firstContentBlock) {
    throw new Error('Response from Anthropic has no content blocks!');
  }

  if (firstContentBlock.type !== 'text') {
    throw new Error('Got unexpected tool_use response from Anthropic!');
  }

  return firstContentBlock.text;
}
