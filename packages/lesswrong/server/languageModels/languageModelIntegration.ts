import { Globals } from '../../lib/vulcan-lib/config';
import { Configuration as OpenAIApiConfiguration, OpenAIApi } from "openai";
import { Tags } from '../../lib/collections/tags/collection';
import { dataToMarkdown } from '../editor/conversionUtils';
import { DatabaseServerSetting } from '../databaseSettings';
import { encode as gpt3encode } from 'gpt-3-encoder'
import drop from 'lodash/drop';

const openAIApiKey = new DatabaseServerSetting<string|null>('languageModels.openai.apiKey', null);
const openAIOrganizationId = new DatabaseServerSetting<string|null>('languageModels.openai.organizationId', null);

let openAIApi: OpenAIApi|null = null;
export async function getOpenAI(): Promise<OpenAIApi|null> {
  if (!openAIApi){
    const apiKey = openAIApiKey.get();
    const organizationId = openAIOrganizationId.get();
    
    if (apiKey) {
      openAIApi = new OpenAIApi(new OpenAIApiConfiguration({
        apiKey,
        organization: organizationId ?? undefined,
      }));
    }
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
  
  const {header, template} = wikiPageToTemplate(tag);
  return {
    api: (header["api"] ?? "disabled") as LanguageModelAPI,
    model: header["model"] ?? "stub",
    task, template
  };
}

export function wikiPageToTemplate(wikiPage: DbTag): {
  header: Record<string,string>,
  template: string,
} {
  let header: Record<string,string> = {};
  let template = "";
  
  const descriptionMarkdown = dataToMarkdown(wikiPage.description?.originalContents?.data, wikiPage.description?.originalContents?.type);
  const lines = descriptionMarkdown.trim().split('\n');
  
  for (let i=0; i<lines.length; i++) {
    const line = lines[i];
    if (line.trim()==="") {
      template = drop(lines,i+1).join("\n");
      break;
    } else {
      const [_headerLine,headerName,headerValue] = line.match(/^([a-zA-Z0-9_]+):\s*([^\s]*)\s*$/)
      header[headerName.toLowerCase()] = headerValue;
    }
  }
  
  return {header, template};
}

/**
 * Given a template for a language-model task, which is in markdown, and a set
 * of key-value pairs, find instances of "${key}" in the text and substitute
 * them. If this would be longer (measured in GPT-3 tokens) than maxLengthTokens,
 * shorten truncatableVariable to fit.
 *
 * This is NOT safe for SQL, HTML rendering, or anything else that's sensitive
 * to quoting. It is intended only for use with language-model prompting.
 */
export function substituteIntoTemplate({template, variables, maxLengthTokens, truncatableVariable}: {
  template: string,
  variables: Record<string,string>
  maxLengthTokens?: number,
  truncatableVariable?: string,
}): string {
  let withVarsSubstituted = template;
  
  // Substitute everything except the truncatable variable
  for (let key of Object.keys(variables)) {
    if (key !== truncatableVariable || !maxLengthTokens)
      withVarsSubstituted = withVarsSubstituted.replace(new RegExp("\\${"+key+"}", "g"), variables[key]);
  }
  
  if (maxLengthTokens && truncatableVariable) {
    const withVarsSubstitutedAndTruncVarRemoved = withVarsSubstituted.replace(new RegExp("\\${"+truncatableVariable+"}", "g"), "");
    const tokensSpent = countGptTokens(withVarsSubstitutedAndTruncVarRemoved);
    const tokensAvailable = maxLengthTokens - tokensSpent;
    const truncatedVar = truncateByTokenCount(variables[truncatableVariable], tokensAvailable);
    withVarsSubstituted = withVarsSubstituted.replace(new RegExp("\\${"+truncatableVariable+"}", "g"), truncatedVar);
  }
  
  return withVarsSubstituted;
}

function countGptTokens(str: string): number {
  return gpt3encode(str).length;
}

/**
 * Truncate a string to a given length, measured in GPT-3 tokens (which only
 * approximately line up with character counts). Uses countGptTokens (which uses
 * gpt-3-encoder) plus binary search. (This could be made faster by instead
 * doing an encode-then-decode round trip, but that raises potential bugs if
 * some character sequences don't roundtrip.)
 */
function truncateByTokenCount(str: string, tokens: number): string {
  let low=0, high=str.length, mid=(low+high)/2|0;
  
  while (high>low) {
    mid=(low+high)/2|0;
    if (countGptTokens(str.substring(0,mid)) > tokens) {
      high = mid;
    } else {
      low = mid+1;
    }
  }
  
  return str.substring(0,mid);
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
      const prompt = substituteIntoTemplate({
        template: job.template,
        variables: job.inputs
      });
      //console.log(`Prompting with: ${JSON.stringify(prompt)}`);
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
