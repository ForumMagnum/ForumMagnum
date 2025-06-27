import OpenAI from "openai";
import { dataToMarkdown } from '../editor/conversionUtils';
import { DatabaseServerSetting, openAIApiKey, openAIOrganizationId } from '../databaseSettings';
import { encode as gpt3encode, decode as gpt3decode } from 'gpt-3-encoder'
import drop from 'lodash/drop';
import take from 'lodash/take';

let openAIApi: OpenAI|null = null;
export async function getOpenAI(): Promise<OpenAI|null> {
  if (!openAIApi){
    const apiKey = openAIApiKey.get();
    const organizationId = openAIOrganizationId.get();
    
    if (apiKey) {
      openAIApi = new OpenAI({
        apiKey,
        organization: organizationId ?? undefined,
      });
    }
  }
  return openAIApi;
}

export function isOpenAIAPIEnabled() {
  const apiKey = openAIApiKey.get();
  return !!apiKey;
}

type LanguageModelAPI = "disabled"|"stub"|"openai";
type LanguageModelClassificationTask = "isSpam"|"isFrontpage";
type LanguageModelGenerationTask = "summarize"|"authorFeedback";
type LanguageModelTask = LanguageModelClassificationTask|LanguageModelGenerationTask;

export type LanguageModelTemplate = {
  header: Record<string,string>
  body: string
}

type LanguageModelConfig = {
  template: LanguageModelTemplate,
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
  const { Tags } = context;
  const wikiPageSlug = taskToWikiSlug(task);
  const tag = await Tags.findOne({slug: wikiPageSlug});
  
  if (tag) {
    return tagToLMConfig(tag, task);
  } else {
    return {
      task,
      api: "stub",
      template: {
        header: {api: "stub"},
        body: "Test ${input}", //eslint-disable-line no-template-curly-in-string
      },
      model: "stub-model",
    };
  }
}

function tagToLMConfig(tag: DbTag, task: LanguageModelTask): LanguageModelConfig {
  if (!tag) throw new Error("Tag not found");
  
  const template = wikiPageToTemplate(tag);
  const {header, body} = template;
  return {
    api: (header["api"] ?? "disabled") as LanguageModelAPI,
    model: header["model"] ?? "stub",
    task, template,
  };
}

export async function wikiSlugToTemplate(slug: string, context: ResolverContext): Promise<LanguageModelTemplate> {
  const { Tags } = context;
  const wikiConfig = await Tags.findOne({slug});
  if (!wikiConfig) throw new Error(`No LM config page ${slug}`);
  return wikiPageToTemplate(wikiConfig);
}

export function wikiPageToTemplate(wikiPage: DbTag): LanguageModelTemplate {
  let header: Record<string,string> = {};
  let body = "";

  if (!wikiPage.description?.originalContents?.type) throw new Error("Missing description type")
  
  const descriptionMarkdown = dataToMarkdown(wikiPage.description?.originalContents?.data, wikiPage.description.originalContents.type);
  const lines = descriptionMarkdown
    .trim()
    .split('\n')
    .map((line: string) => line.trim());
  
  for (let i=0; i<lines.length; i++) {
    const line = lines[i];
    if (line.trim()==="") {
      body = drop(lines,i+1).join("\n");
      break;
    } else {
      const [_headerLine,headerName,headerValue] = line.match(/^([a-zA-Z0-9_-]+):\s*([^\s]*)\s*$/)
      header[headerName.toLowerCase()] = headerValue;
    }
  }
  
  return {header, body};
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
  template: LanguageModelTemplate,
  variables: Record<string,string>
  maxLengthTokens?: number,
  truncatableVariable?: string,
}): string {
  let withVarsSubstituted = template.body;
  
  // Substitute everything except the truncatable variable
  for (let key of Object.keys(variables)) {
    if (key !== truncatableVariable || !maxLengthTokens)
      withVarsSubstituted = withVarsSubstituted.replace(new RegExp("\\${"+key+"}", "g"), variables[key]);
  }
  
  if (maxLengthTokens && truncatableVariable) {
    const withVarsSubstitutedAndTruncVarRemoved = withVarsSubstituted.replace(new RegExp("\\${"+truncatableVariable+"}", "g"), "");
    const tokensSpent = countGptTokens(withVarsSubstitutedAndTruncVarRemoved);
    const tokensAvailable = maxLengthTokens - tokensSpent;
    const truncatedVar = truncateByTokenCount(variables[truncatableVariable]||"", tokensAvailable);
    withVarsSubstituted = withVarsSubstituted.replace(new RegExp("\\${"+truncatableVariable+"}", "g"), truncatedVar);
  }
  
  return withVarsSubstituted;
}

function countGptTokens(str: string): number {
  if (!str) return 0;
  try {
    return gpt3encode(str).length;
  } catch(e) {
    return str.length;
  }
}

/**
 * Truncate a string to a given length, measured in GPT-3 tokens (which only
 * approximately line up with character counts). Uses countGptTokens (which uses
 * gpt-3-encoder) plus binary search. (This could be made faster by instead
 * doing an encode-then-decode round trip, but that raises potential bugs if
 * some character sequences don't roundtrip.)
 */
function truncateByTokenCount(str: string, tokens: number): string {
  if (!str || !str.length)
    return "";
  if (str.length < tokens)
    return str;
  
  // First try an encode-then-decode roundtrip
  try {
    const encoded = gpt3encode(str);
    
    if (encoded.length <= tokens) return str;
    const redecoded = gpt3decode(take(encoded,tokens));
    if (redecoded === str.substring(0,redecoded.length)) {
      return redecoded;
    } else {
      // eslint-disable-next-line no-console
      console.log(`GPT-3 encoding did not roundtrip: ${JSON.stringify(str)}`);
    }
  } catch {
    console.log(`Could not encode string for truncation length estimate: ${JSON.stringify(str)}`); //eslint-disable-line no-console
  }
  
  // If that didn't work, binary-search string truncations to find one that has the right token count
  let low=0, high=str.length;
  let mid=(low+high)/2 | 0; //Midpoint, round down (bitwise-or-0 is a JS cast-to-int idiom)
  
  while (high>low) {
    if (countGptTokens(str.substring(0,mid)) > tokens) {
      high = mid;
    } else {
      low = mid+1;
    }
    mid=(low+high)/2|0;
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
      const response = await api.completions.create({
        model: job.model,
        prompt: prompt,
        max_tokens: job.maxTokens,
      });
      const topResult = response.choices[0].text;
      if (topResult) return topResult;
      else throw new Error("API did not return a top result");
    }
    default: {
      throw new Error(`Invalid language model API: ${job.api}`);
    }
  }
}
