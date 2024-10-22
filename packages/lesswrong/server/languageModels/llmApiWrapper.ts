import type { ChatModel as OpenAIModel, ChatCompletionSystemMessageParam as OpenAISystemMessage } from 'openai/resources/chat';
import type { ChatCompletionCreateParamsBase as OpenAISendMessagesParams } from 'openai/resources/chat/completions';
import type { Model as AnthropicModel } from '@anthropic-ai/sdk/resources/messages';
import type { MessageCreateParamsBase as AnthropicSendMessagesParams, PromptCachingBetaMessageParam as AnthropicMessage, PromptCachingBetaTextBlockParam as AnthropicMessageTextBlock } from '@anthropic-ai/sdk/resources/beta/prompt-caching/messages';

import { getOpenAI } from './languageModelIntegration';
import { getAnthropicPromptCachingClientOrThrow } from './anthropicClient';

export interface SendOpenAIMessages {
  provider: 'openai';
  model: OpenAIModel;
  messages: OpenAISendMessagesParams['messages'];
  maxTokens: OpenAISendMessagesParams['max_tokens'];
  tools?: AnthropicSendMessagesParams['tools'];
  toolChoice?: AnthropicSendMessagesParams['tool_choice'];
  system?: AnthropicSendMessagesParams['system'];
}

export interface SendAnthropicMessages {
  provider: 'anthropic';
  model: AnthropicModel;
  messages: Array<Omit<AnthropicMessage, 'content'> & { content: string | AnthropicMessageTextBlock[] }>;
  maxTokens: AnthropicSendMessagesParams['max_tokens'];
  system?: AnthropicSendMessagesParams['system'];
  tools?: AnthropicSendMessagesParams['tools'];
  toolChoice?: AnthropicSendMessagesParams['tool_choice'];
  customApiKey?: string;
}

export type SendLLMMessagesArgs = SendOpenAIMessages | SendAnthropicMessages;

function convertAnthropicToolsToOpenAI(tools: Exclude<AnthropicSendMessagesParams['tools'], undefined>): OpenAISendMessagesParams['tools'] {
  return tools?.map(tool => {
    return {
      type: 'function',
      function: {
        name: tool.name,
        description: tool.description,
        parameters: tool.input_schema,
        strict: true,
      }
    }
  });
}

function convertAnthropicToolChoiceToOpenAI(toolChoice: Exclude<AnthropicSendMessagesParams['tool_choice'], undefined>): OpenAISendMessagesParams['tool_choice'] {
  if (toolChoice?.type !== 'tool') {
    throw new Error('Only supports forced tool-choice for OpenAI tool_choice!');
  }

  return {
    type: 'function',
    function: {
      name: toolChoice.name
    }
  };
}

function convertAnthropicSystemMessageToOpenAI(system: Exclude<AnthropicSendMessagesParams['system'], undefined>): OpenAISystemMessage {
  return {
    role: 'system',
    content: system
  };
}

export async function sendMessagesToLlm<T extends SendLLMMessagesArgs>(args: T) {
  if (args.provider === 'openai') {
    const client = await getOpenAI();
    if (!client) {
      throw new Error(`Couldn't get OpenAI Client!`);
    }

    const { maxTokens, model, messages, system, tools, toolChoice } = args;

    const allMessages = [...messages];
    if (system) {
      allMessages.unshift(convertAnthropicSystemMessageToOpenAI(system));
    }

    const response = await client.chat.completions.create({
      model,
      max_tokens: maxTokens,
      messages: allMessages,
      tools: tools ? convertAnthropicToolsToOpenAI(tools) : undefined,
      tool_choice: toolChoice ? convertAnthropicToolChoiceToOpenAI(toolChoice) : undefined,
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
