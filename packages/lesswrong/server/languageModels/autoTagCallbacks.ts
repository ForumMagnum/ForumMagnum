import { LanguageModelTemplate, wikiSlugToTemplate, substituteIntoTemplate } from './languageModelIntegration';
import { dataToMarkdown } from '../editor/conversionUtils';
import type OpenAI from "openai";
import { autoFrontpageModelSetting, autoFrontpagePromptSetting, tagBotAccountSlug } from '../databaseSettings';
import { cheerioParse } from '../utils/htmlUtil';

/**
 * To set up automatic tagging:
 *
 * 1. Create an account that the auto-applied tags will be attributed to. Put
 *    its slug in the `languageModels.autoTagging.taggerAccountSlug` server
 *    setting.
 *
 * 2. Go to /tag/create (or /topics/create) and create a wiki page named
 *    "LM Config Autotag". Under Advanced Options, set the "Admin Only" and
 *    "Wiki Only" options. Give it a body that looks like this:
 *       api: openai
 *       model: babbage
 *       max-length-tokens: 2040
 *       max-length-truncate-field: text
 *
 *       ${title}${linkpostMeta}
 *
 *       ${text}
 *
 *       ===
 *
 *       ${tagPrompt}
 *
 * 3. Go to each tag that you want to automatically apply. For each one, fill
 *    in the "Auto-tag classifier prompt string" option in the Advanced Options
 *    section. This prompt string will be substituted into the ${tagPrompt}
 *    field in the template you just created. Write a sentence which asks
 *    whether the tag applies, in a sentence. For example the Community tag
 *    prompt might be:
 *       Is this post about the rationalist community dynamics, events, people or gossip?
 *    (This is used when training and querying the language model but not shown
 *    to users.)
 *
 * 4. If you don't already have one, create an OpenAI account at
 *    https://beta.openai.com/ and set up billing information. Get an API key
 *    from https://beta.openai.com/account/api-keys and put the API key in the
 *    database server setting `languageModels.openai.apiKey`. The API key
 *    starts with `sk-`.
 *
 * 5. Generate lists of post IDs to use as train and test sets. Look at
 *    generateCandidateSetsForTagClassification in
 *    packages/lesswrong/server/scripts/languageModels/generateTaggingPostSets.ts
 *    and consider whether you want to customize the date range, minimum karma,
 *    and other filters. Then make sure you have a locally running server connected
 *    to a database with suitable training data, and run the script with
 *        yarn repl prod packages/lesswrong/server/scripts/generativeModels/generateTaggingPostSets.ts "generateCandidateSetsForTagClassification()"
 *    This will generate two files, ml/tagClassificationPostIds.{train,test}.json
 *    each of which is a list of post IDs.
 *
 * 6. Prepare data for the training and test sets. Run
 *        yarn repl prod packages/lesswrong/server/scripts/generativeModels/generateTaggingPostSets.ts "generateTagClassifierData()"
 *    This step is memory-intensive (currently it just loads the whole data set
 *    into memory at once). If it runs out of memory, you may need to configure
 *    node to have a heap-size limit larger than the default of 4GB. To do this,
 *   edit `serverCli` in `build.js` to add the option
 *        `--max_old_space_size=16000`
 *    This will generate two files for each tag,
 *        named ml/tagClassification.TAG.{train,test}.jsonl
 *    Take a look at a few of these and make sure they look right.
 *
 * 7. Install the OpenAI command-line API (if it isn't already installed.) with:
 *         pip install --upgrade openai
 *    (Depending on your system this might be `pip3` instead. If this succeeds
 *    you should be able to run `openai` from the command line in any directory.)
 *    Check the version number with
 *         pip show openai
 *    This should be 1.7.1 or later.
 *
 * 8. Run fine-tuning jobs. First put the API key into your environment, then start the fine-tuning job with
          export OPENAI_API_KEY=YOURAPIKEYHERE
          scripts/fineTuneTagClassifiers.py \
            --train ml/tagClassification.${TAG}.train.jsonl \
            --test ml/tagClassification.${TAG}.test.jsonl \
 *    Substituting in ${TAG}, and repeat for each tag.
 *    You can also do this with their web UI; see see
 *        https://platform.openai.com/docs/guides/fine-tuning
 *
 * 9. Retrieve the fine-tuned model IDs. Run
 *        openai api fine_tunes.list
 *    This will output a list of fine-tuned models you've created. The field
 *    you want is named `fine_tuned_model` and looks like
 *        babbage:ft-personal-YYYY-MM-DD-HH-mm-ss
 *    For each tag, find the corresponding model ID, go to the corresponding tag
 *    page, and put the model ID in the "auto-tag classifier model ID" field.
 *
 * 10. Generate a comparison list between human-applied and auto-applied tags for
 *     the test set.
 *        yarn repl prod packages/lesswrong/server/scripts/generativeModels/generateTaggingPostSets.ts 'evaluateTagModels("ml/tagClassificationPostIds.test.json", "ml/tagClassificationTestSetResults.txt")'
 *     This produces a text file ml/tagClassificationTestSetResults.txt with a
 *     list of post titles/links, how humans tagged them, and how the trained
 *     models tagged them. Make sure this looks reasonable.
 */

const bodyWordCountLimit = 1500;

/**
 * Preprocess HTML before converting to markdown to be then converted into a
 * language model prompt. Strips links, and replaces images with their alt text
 * or with "IMAGE". We do this to prevent URLs (which tend to be long, and
 * uninformative, and prone to future distribution shifts if we change how our
 * image hosting works) from chewing up limited context-window space.
 *
 * TODO: Replace images with their alt text
 * TODO: Replace any Unicode characters that are going to cause trouble for the GPT-3 tokenizer
 */
function preprocessHtml(html: string): string {
  const $ = cheerioParse(html) as any;
  $('a').contents().unwrap();
  return $.html();
}

export async function postToPrompt({template, post, promptSuffix, postBodyCache}: {
  template: LanguageModelTemplate,
  post: PostsHTML & DbPost,
  promptSuffix: string
  // Optional mapping from post ID to markdown body, to avoid redoing the html-to-markdown conversions
  postBodyCache?: PostBodyCache,
}): Promise<string> {
  const {header, body} = template;
  
  const markdownPostBody = postBodyCache?.preprocessedBody?.[post._id] ?? preprocessPostHtml(post.contents?.html ?? '');
  const linkpostMeta = ('url' in post && post.url) ? `\nThis is a linkpost for ${post.url}` : '';
  
  const withTemplate = substituteIntoTemplate({
    template,
    maxLengthTokens: parseInt(header["max-length-tokens"]),
    truncatableVariable: "text",
    variables: {
      title: post.title,
      linkpostMeta,
      text: markdownPostBody,
      tagPrompt: promptSuffix,
    }
  });
  
  // Replace the string <|endoftext|> with __endoftext__ because the former is
  // special to the tokenizer (and will cause input-validation to fail), and it
  // tends to appear in posts that talk about LLMs.
  return withTemplate.replace(/<\|endoftext\|>/g, "__endoftext__");
}

function preprocessPostHtml(postHtml: string): string {
  const markdownPostBody = postHtml ? dataToMarkdown(preprocessHtml(postHtml), "html") : "";
  return markdownPostBody;
}

export type PostBodyCache = {preprocessedBody: Record<string,string>}
export function generatePostBodyCache(posts: (PostsHTML & DbPost)[]): PostBodyCache {
  const result: PostBodyCache = {preprocessedBody: {}};
  for (let post of posts) {
    result.preprocessedBody[post._id] = preprocessPostHtml(post.contents?.html ?? "");
  }
  return result;
}

const CHAT_MODEL_BASENAMES = [
  'gpt-4', // gpt-4o or gpt-4o-mini currently (2024-08-20) recommended
  'gpt-3.5-turbo'
]

async function booleanLLMCheck(
  model: string,
  prompt: string,
  openAIApi: OpenAI
): Promise<boolean> {
  let completion = "";

  if (CHAT_MODEL_BASENAMES.some(name => model.includes(name))) {
    const chatCompletion = await openAIApi.chat.completions.create({
      model,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });
    completion = chatCompletion.choices[0].message.content?.trim().toLowerCase() ?? "no";
  } else {
    const languageModelResult = await openAIApi.completions.create({
      model,
      prompt,
      max_tokens: 1,
    });
    completion = languageModelResult.choices[0].text!;
  }

  const finalWord = completion.trim().toLowerCase().split(/[\n\s]+/).pop();
  return finalWord === "yes";
}

export async function checkTags(
  post: PostsHTML & DbPost,
  tags: DbTag[],
  openAIApi: OpenAI,
  context: ResolverContext,
) {
  const template = await wikiSlugToTemplate("lm-config-autotag", context);
  
  let tagsApplied: Record<string,boolean> = {};
  
  for (let tag of tags) {
    if (!tag.autoTagPrompt || !tag.autoTagModel)
      continue;

    try {
      const userPrompt = await postToPrompt({template, post, promptSuffix: tag.autoTagPrompt});
      tagsApplied[tag.slug] = await booleanLLMCheck(tag.autoTagModel, userPrompt, openAIApi);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(e);
      continue;
    }
  }
  
  return tagsApplied;
}

export async function checkFrontpage(
  post: PostsHTML & DbPost,
  openAIApi: OpenAI,
  context: ResolverContext,
) {
  const template = await wikiSlugToTemplate("lm-config-autotag", context);

  const autoFrontpageModel = autoFrontpageModelSetting.get()
  const autoFrontpagePrompt = autoFrontpagePromptSetting.get()

  if (!autoFrontpageModel || !autoFrontpagePrompt) {
    return false;
  }

  try {
    const userPrompt = await postToPrompt({template, post, promptSuffix: autoFrontpagePrompt});
    return await booleanLLMCheck(autoFrontpageModel, userPrompt, openAIApi);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(e);
    return false;
  }
}


export async function getTagBotAccount(context: ResolverContext): Promise<DbUser|null> {
  const { Users } = context;
  const accountSlug = tagBotAccountSlug.get();
  if (!accountSlug) return null;
  const account = await Users.findOne({slug: accountSlug});
  if (!account) return null;
  return account;
}

let tagBotUserIdPromise: Promise<void>|null = null;
// If undefined, hasn't been fetched yet; if null, the account doesn't exist.
let tagBotUserId: string|null|undefined = undefined;

/**
 * Get the ID of the tag-bot account, with caching. The first call to this will
 * fetch the tagger account (using the tagBotAccountSlug config setting); all
 * subsequent calls will return a cached value. If called while that first
 * fetch is in-flight, waits for that request to finish, rather than starting a
 * duplicate (this affects server-startup performance during development).
 */
export async function getTagBotUserId(context: ResolverContext): Promise<string|null> {
  if (tagBotUserId === undefined) {
    if (!tagBotUserIdPromise) {
      tagBotUserIdPromise = new Promise((resolve) => {
        void (async () => {
          const tagBotAccount = await getTagBotAccount(context);
          tagBotUserId = tagBotAccount?._id ?? null;
          
          // Discard the promise after we're done with it. Previously we didn't
          // do this, and kept the promise in a global variable forever after it
          // was resolved. That made this function simpler, but caused a memory
          // leak: the promise captures its context, including the
          // ResolverContext we got passed, which retains everything from the
          // whole pageload.
          tagBotUserIdPromise = null;
          resolve();
        })();
      });
    }
    await tagBotUserIdPromise
  }
  return tagBotUserId ?? null;
}

export async function getAutoAppliedTags(context: ResolverContext): Promise<DbTag[]> {
  const { Tags } = context;
  return await Tags.find({
    autoTagPrompt: {$exists: true, $ne: ""},
    deleted: false,
  }).fetch();
}
