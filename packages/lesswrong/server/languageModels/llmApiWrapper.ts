import type { ChatCompletionSystemMessageParam as OpenAISystemMessage } from 'openai/resources/chat';
import type { ChatModel as OpenAIModel } from 'openai/resources/shared';
import type { ChatCompletionCreateParamsBase as OpenAISendMessagesParams } from 'openai/resources/chat/completions';
import type { Model as AnthropicModel } from '@anthropic-ai/sdk/resources/messages';
import type { MessageCreateParamsBase as AnthropicSendMessagesParams, PromptCachingBetaMessageParam as AnthropicMessage, PromptCachingBetaToolUseBlockParam as AnthropicMessageToolUseBlock, PromptCachingBetaToolResultBlockParam as AnthropicMessageToolResultBlock, PromptCachingBetaTextBlockParam as AnthropicMessageTextBlock, PromptCachingBetaTool } from '@anthropic-ai/sdk/resources/beta/prompt-caching/messages';

import { getOpenAI } from './languageModelIntegration';
import { getAnthropicPromptCachingClientOrThrow } from './anthropicClient';
import { z } from 'zod';
import { zodResponseFormat } from 'openai/helpers/zod';
import { zodToJsonSchema } from 'zod-to-json-schema';

interface SendToolUseRequest<T> {
  zodParser: z.ZodType<T>;
  name: string;
}

interface SendNonToolUseRequest {
  zodParser?: undefined;
  name?: undefined;
}

type SendMaybeToolUseRequest<T extends boolean, ZodType> = T extends true 
  ? SendToolUseRequest<ZodType> 
  : SendNonToolUseRequest;

export type SendOpenAIMessages<ToolUse extends boolean = false, ZodType = never> = SendMaybeToolUseRequest<ToolUse, ZodType> & {
  provider: 'openai';
  model: OpenAIModel;
  messages: OpenAISendMessagesParams['messages'];
  maxTokens: OpenAISendMessagesParams['max_tokens'];
  system?: AnthropicSendMessagesParams['system'];
}

export type SendAnthropicMessages<ToolUse extends boolean = false, ZodType = never> = SendMaybeToolUseRequest<ToolUse, ZodType> & {
  provider: 'anthropic';
  model: AnthropicModel;
  messages: Array<Omit<AnthropicMessage, 'content'> & { content: string | (AnthropicMessageTextBlock | AnthropicMessageToolUseBlock | AnthropicMessageToolResultBlock)[] }>;
  maxTokens: AnthropicSendMessagesParams['max_tokens'];
  system?: AnthropicSendMessagesParams['system'];
  customApiKey?: string;
}

export type SendLLMMessagesArgs<
  ToolUse extends boolean = boolean,
  ZodType = any
> = SendOpenAIMessages<ToolUse, ZodType> | SendAnthropicMessages<ToolUse, ZodType>;

type SendLLMMessageReturnTypes<T extends SendLLMMessagesArgs> = T['zodParser'] extends undefined ? string : z.infer<Exclude<T['zodParser'], undefined>> | null;

function convertAnthropicToolsToOpenAI(tools: Exclude<AnthropicSendMessagesParams['tools'], undefined>): OpenAISendMessagesParams['tools'] {
  return tools.map(tool => {
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
  if (toolChoice.type !== 'tool') {
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

export function convertZodParserToAnthropicTool(zodParser: z.ZodType<any>, name: string): PromptCachingBetaTool {
  const jsonSchema = zodToJsonSchema(zodParser, name);
  const inputSchema = jsonSchema.definitions?.[name];
  if (!inputSchema) {
    throw new Error(`Couldn't find tool definition for ${name}!`);
  }

  if (!('type' in inputSchema) || inputSchema.type !== 'object') {
    throw new Error(`Missing 'type' field in input schema for ${name}!`);
  }

  return {
    name,
    input_schema: inputSchema as PromptCachingBetaTool['input_schema'],
    description: zodParser.description
  };
}

export async function sendMessagesToLlm<T extends SendLLMMessagesArgs>(args: T): Promise<SendLLMMessageReturnTypes<T>> {
  if (args.provider === 'openai') {
    const client = await getOpenAI();
    if (!client) {
      throw new Error(`Couldn't get OpenAI Client!`);
    }

    const { maxTokens, model, messages, system, zodParser, name } = args;

    const allMessages = [...messages];
    if (system) {
      allMessages.unshift(convertAnthropicSystemMessageToOpenAI(system));
    }

    if (zodParser) {
      const response = await client.beta.chat.completions.parse({
        model,
        max_tokens: maxTokens,
        messages: allMessages,
        response_format: zodResponseFormat(zodParser, name),
      });

      const [firstContentBlock] = response.choices;

      if (!firstContentBlock) {
        throw new Error('Response from OpenAI has no content blocks!');
      }

      return firstContentBlock.message.parsed as SendLLMMessageReturnTypes<T>;
    }

    const response = await client.beta.chat.completions.parse({
      model,
      max_tokens: maxTokens,
      messages: allMessages,
    });

    const [firstContentBlock] = response.choices;

    if (!firstContentBlock) {
      throw new Error('Response from OpenAI has no content blocks!');
    }

    return firstContentBlock.message.content as SendLLMMessageReturnTypes<T>;
  }
  
  const client = getAnthropicPromptCachingClientOrThrow(args.customApiKey);

  const { maxTokens, messages, model, system, zodParser, name } = args;

  if (zodParser) {
    const tool = convertZodParserToAnthropicTool(zodParser, name);
    const tools = [tool];
    const toolChoice: AnthropicSendMessagesParams['tool_choice'] = { name, type: 'tool' };

    const response = await client.messages.create({
      model,
      max_tokens: maxTokens,
      messages,
      system,
      tools,
      tool_choice: toolChoice,
    });

    const [firstContentBlock] = response.content;

    if (!firstContentBlock) {
      throw new Error('Response from Anthropic has no content blocks!');
    }

    if (firstContentBlock.type !== 'tool_use') {
      throw new Error('Got unexpected non-tool-use response from Anthropic!');
    }

    const responseContent = firstContentBlock.input;
    const validatedTerm = zodParser.safeParse(responseContent);
    if (!validatedTerm.success) {
      throw new Error('Invalid tool use response from Anthropic!');
    }

    return validatedTerm.data as SendLLMMessageReturnTypes<T>;
  }

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
