// eslint-disable-next-line no-restricted-imports
import type OpenAI from "openai";
import { dataToMarkdown } from '../editor/conversionUtils';
import { openAIOrganizationId } from '../databaseSettings';
import drop from 'lodash/drop';
import take from 'lodash/take';

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

export type LanguageModelTemplate = {
  header: Record<string,string>
  body: string
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
    const { encode: gpt3encode } = require("gpt-3-encoder");
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
    const { encode: gpt3encode, decode: gpt3decode } = require("gpt-3-encoder");
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
