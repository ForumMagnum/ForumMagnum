import { Configuration as OpenAIApiConfiguration, OpenAIApi } from "openai";
import { Tags } from '../../lib/collections/tags/collection';
import { dataToMarkdown } from '../editor/conversionUtils';
import drop from 'lodash/drop';

// Put your OpenAI API key here. TODO: Make this an instance setting.
const openAIApiKey:string|null = null;

let openAIApi: OpenAIApi|null = null;
async function getOpenAI(): Promise<OpenAIApi|null> {
  if (!openAIApi && openAIApiKey) {
    openAIApi = new OpenAIApi(new OpenAIApiConfiguration({
      apiKey: openAIApiKey,
    }));
  }
  return openAIApi;
}

type LanguageModelAPI = "disabled"|"stub"|"openai";
type LanguageModelClassificationTask = "isSpam"|"isFrontpage";
type LanguageModelGenerationTask = "summarize"|"authorFeedback";
type LanguageModelTask = LanguageModelClassificationTask|LanguageModelGenerationTask;

type LanguageModelConfig = {
  template: string,
  task: LanguageModelTask,
  api: LanguageModelAPI,
  model: string,
}

type LanguageModelJob = LanguageModelConfig & {
  maxTokens: number
  inputs: Record<string,string>
}

/**
 * canDoLanguageModelTask: Returns true if we're configured with an API key,
 * prompts and anything else necessary to perform a language-model-based task.
 * If this is false, UI for corresponding language-model-based features should
 * not be displayed on the client.
 *
 * (Attempting to run language-model tasks may still fail even if this returned
 * true, eg if we get an error from the OpenAI API).
 */
export async function canDoLanguageModelTask(task: LanguageModelTask, context: ResolverContext): Promise<boolean> {
  const config = await getLMConfigForTask(task, context);
  return (config && config.api!=="disabled");
}

function taskToWikiSlug(task: LanguageModelTask): string {
  return `lm-config-${task.toLowerCase()}`;
}

/**
 * Given a language-model task type, retrieve a corresponding template. Uses the
 * text of an admin-only wiki page, formatted as Markdown.
 */
async function getLMConfigForTask(task: LanguageModelTask, context: ResolverContext): Promise<LanguageModelConfig> {
  const wikiPageSlug = taskToWikiSlug(task);
  const tag = await Tags.findOne({slug: wikiPageSlug});
  
  if (tag) {
    return tagToLMConfig(tag, task);
  } else {
    return {
      task,
      api: "stub",
      template: "Test ${input}", //eslint-disable-line no-template-curly-in-string
      model: "stub-model",
    };
  }
}

function tagToLMConfig(tag: DbTag, task: LanguageModelTask): LanguageModelConfig {
  if (!tag) throw new Error("Tag not found");
  const descriptionMarkdown = dataToMarkdown(tag.description?.originalContents?.data, tag.description?.originalContents?.type);
  const lines = descriptionMarkdown.trim().split('\n');
  
  let api: LanguageModelAPI = "disabled";
  let model = "stub";
  let template = "";
  for (let i=0; i<lines.length; i++) {
    const line = lines[i];
    if (line.trim()==="") {
      template = drop(lines,i+1).join("\n");
      break;
    }
    
    const [_headerLine,headerName,headerValue] = line.match(/^([a-zA-Z0-9_]+):\s*([^\s]*)\s*$/)
    switch(headerName.toLowerCase()) {
      case "api":
        api = headerValue as LanguageModelAPI;
        break;
      case "model":
        model = headerValue;
        break;
    }
  }
  
  return { api, model, task, template };
}

/**
 * Given a template for a language-model task, which is in markdown, and a set
 * of key-value pairs, find instances of "${key}" in the text and substitute
 * them.
 *
 * This is NOT safe for SQL, HTML rendering, or anything else that's sensitive
 * to quoting. It is intended only for use with language-model prompting.
 */
function substituteIntoTemplate(template: string, inputs: Record<string,string>): string {
  let result = template;
  
  for (let key of Object.keys(inputs)) {
    result = result.replace(new RegExp("\\${"+key+"}", "g"), inputs[key]);
  }
  
  return result;
}

/**
 * Perform a binary-classification task using a language model. The provided
 * input is the text that is being classified; it does *not* include the wrapping
 * template, which is admin-configurable and loaded from the database.
 */
export async function languageModelClassify({taskName, inputs, context}: {
  taskName: LanguageModelClassificationTask,
  inputs: Record<string,string>,
  context: ResolverContext,
}): Promise<boolean|"maybe"> {
  const lmConfig = await getLMConfigForTask(taskName, context);
  const continuation = await languageModelExecute({
    template: lmConfig.template,
    inputs,
    task: lmConfig.task,
    api: lmConfig.api,
    model: lmConfig.model,
    maxTokens: 1,
  });
  const tokenizedContinuation = continuation.split(/\s+/);
  const firstToken = tokenizedContinuation[0];
  
  if (firstToken.toLowerCase()==="yes")
    return true;
  else if (firstToken.toLowerCase()==="no")
    return false;
  else
    return "maybe";
}

/**
 * Perform a text-generation task using a language model. The provided input is
 the text that is being classified; it does *not* include the wrapping template,
 * which is admin-configurable and loaded from the database.
 */
export async function languageModelGenerateText({taskName, inputs, maxTokens, context}: {
  taskName: LanguageModelGenerationTask,
  inputs: Record<string,string>,
  maxTokens: number,
  context: ResolverContext,
}): Promise<string> {
  const lmConfig = await getLMConfigForTask(taskName, context);
  const continuation = await languageModelExecute({
    template: lmConfig.template,
    inputs,
    task: lmConfig.task,
    api: lmConfig.api,
    model: lmConfig.model,
    maxTokens,
  });
  return continuation;
}

async function languageModelExecute(job: LanguageModelJob): Promise<string> {
  // TODO: Check and populate the cache
  
  switch(job.api) {
    default: {
      throw new Error(`Invalid language model API: ${job.api}`);
    }
    case "disabled": {
      throw new Error(`Language model not available for job type: ${job.task}`);
    }
    case "stub": {
      return `Placeholder language model. Template was: ${JSON.stringify(job.template)}.\n\nInputs were: ${JSON.stringify(job.inputs)}.`;
      break;
    }
    case "openai": {
      const api = await getOpenAI();
      if (!api) throw new Error("OpenAI API not configured");
      const prompt = substituteIntoTemplate(job.template, job.inputs);
      console.log(`Prompting with: ${JSON.stringify(prompt)}`);
      const response = await api.createCompletion({
        model: job.model,
        prompt: prompt,
        max_tokens: job.maxTokens,
        //temperature: 0.7,
        //top_p: 1,
        //frequency_penalty: 0,
        //presence_penalty: 0,
      });
      const topResult = response.data.choices[0].text;
      if (topResult) return topResult;
      else throw new Error("API did not return a top result");
    }
  }
}
