import { LanguageModelTemplate, getOpenAI, wikiSlugToTemplate, substituteIntoTemplate } from './languageModelIntegration';
import { CreateCallbackProperties, getCollectionHooks, UpdateCallbackProperties } from '../mutationCallbacks';
import { truncate } from '../../lib/editor/ellipsize';
import { dataToMarkdown, htmlToMarkdown } from '../editor/conversionUtils';
import type { OpenAIApi } from "openai";
import { Tags } from '../../lib/collections/tags/collection';
import { addOrUpvoteTag } from '../tagging/tagsGraphQL';
import { DatabaseServerSetting } from '../databaseSettings';
import { Users } from '../../lib/collections/users/collection';
import { cheerioParse } from '../utils/htmlUtil';
import { isAnyTest } from '../../lib/executionEnvironment';

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
 *        scripts/serverShellCommand.sh 'Globals.generateCandidateSetsForTagClassification()'
 *    This will generate two files, ml/tagClassificationPostIds.{train,test}.json
 *    each of which is a list of post IDs.
 *
 * 6. Prepare data for the training and test sets. Run
 *        scripts/serverShellCommand.sh 'Globals.generateTagClassifierData()'
 *    This step is memory-intensive (currently it just loads the whole data set
 *    into memory at once). If it runs out of memory, you may need to configure
 *    node to have a heap-size limit larger than the default of 4GB. To do this,
 *   edit `serverCli` in `build.js` to add the option
 *        `--max_old_space_size=16000`
 *    This will generate two files for each tag,
 *        named ml/tagClassification.TAG.{train,test}.jsonl
 *    Take a look at a few of these and make sure they look right.
 *
   7. Install the OpenAI command-line API (if it isn't already installed.) with:
           pip install --upgrade openai
      (Depending on your system this might be `pip3` instead. If this succeeds
      you should be able to run `openai` from the command ine in any directory.)
 *
 * 8. Run fine-tuning jobs. First put the API key into your environment, then start the fine-tuning job using the OpenAI CLI.
          export OPENAI_API_KEY=YOURAPIKEYHERE
          openai api fine_tunes.create \
            -m babbage --compute_classification_metrics --classification_positive_class " yes" \
            -t ml/tagClassification.${TAG}.train.jsonl \
            -v ml/tagClassification.${TAG}.test.jsonl
      Substituting in ${TAG}, and repeat for each tag.
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
 *        scripts/serverShellCommand.sh 'Globals.evaluateTagModels("ml/tagClassificationPostIds.test.json", "ml/tagClassificationTestSetResults.txt")'
 *     This produces a text file ml/tagClassificationTestSetResults.txt with a
 *     list of post titles/links, how humans tagged them, and how the trained
 *     models tagged them. Make sure this looks reasonable.
 */

const bodyWordCountLimit = 1500;
const tagBotAccountSlug = new DatabaseServerSetting<string|null>('languageModels.autoTagging.taggerAccountSlug', null);


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
  post: DbPost,
  promptSuffix: string
  // Optional mapping from post ID to markdown body, to avoid redoing the html-to-markdown conversions
  postBodyCache?: PostBodyCache
}): Promise<string> {
  const {header, body} = template;
  
  const markdownPostBody = postBodyCache?.preprocessedBody?.[post._id] ?? preprocessPostBody(post);
  
  const linkpostMeta = post.url ? `\nThis is a linkpost for ${post.url}` : '';
  
  return substituteIntoTemplate({
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
}

function preprocessPostBody(post: DbPost): string {
  const postHtml = post.contents?.html;
  const markdownPostBody = postHtml ? dataToMarkdown(preprocessHtml(postHtml), "html") : "";
  return markdownPostBody;
}

export type PostBodyCache = {preprocessedBody: Record<string,string>}
export function generatePostBodyCache(posts: DbPost[]): PostBodyCache {
  const result: PostBodyCache = {preprocessedBody: {}};
  for (let post of posts) {
    result.preprocessedBody[post._id] = preprocessPostBody(post);
  }
  return result;
}

export async function checkTags(post: DbPost, tags: DbTag[], openAIApi: OpenAIApi) {
  const template = await wikiSlugToTemplate("lm-config-autotag");
  
  let tagsApplied: Record<string,boolean> = {};
  
  for (let tag of tags) {
    if (!tag.autoTagPrompt || !tag.autoTagModel)
      continue;
    const languageModelResult = await openAIApi.createCompletion({
      model: tag.autoTagModel,
      prompt: await postToPrompt({template, post, promptSuffix: tag.autoTagPrompt}),
      max_tokens: 1,
    });
    const completion = languageModelResult.data.choices[0].text!;
    const hasTag = (completion.trim().toLowerCase() === "yes");
    tagsApplied[tag.slug] = hasTag;
  }
  
  return tagsApplied;
}


async function getTagBotAccount(context: ResolverContext): Promise<DbUser|null> {
  const accountSlug = tagBotAccountSlug.get();
  if (!accountSlug) return null;
  const account = await Users.findOne({slug: accountSlug});
  if (!account) return null;
  return account;
}

let tagBotUserIdCache: Promise<{id:string|null}>|null = null;
export async function getTagBotUserId(context: ResolverContext): Promise<string|null> {
  if (!tagBotUserIdCache) {
    tagBotUserIdCache = (async () => {
      const tagBotAccount = await getTagBotAccount(context);
      return {id: tagBotAccount?._id ?? null};
    })();
  }
  return (await tagBotUserIdCache).id;
}

export async function getAutoAppliedTags(): Promise<DbTag[]> {
  return await Tags.find({ autoTagPrompt: {$exists: true, $ne: ""} }).fetch();
}

async function autoApplyTagsTo(post: DbPost, context: ResolverContext): Promise<void> {
  const api = await getOpenAI();
  if (!api) {
    if (!isAnyTest) {
      //eslint-disable-next-line no-console
      console.log("Skipping autotagging (API not configured)");
    }
    return;
  }
  const tagBot = await getTagBotAccount(context);
  if (!tagBot) {
    //eslint-disable-next-line no-console
    console.log("Skipping autotagging (no tag-bot account)");
    return;
  }
  
  const tags = await getAutoAppliedTags();
  const tagsApplied = await checkTags(post, tags, api);
  
  //eslint-disable-next-line no-console
  console.log(`Auto-applying tags to post ${post.title} (${post._id}): ${JSON.stringify(tagsApplied)}`);
  
  for (let tag of tags) {
    if (tagsApplied[tag.slug]) {
      await addOrUpvoteTag({
        tagId: tag._id,
        postId: post._id,
        currentUser: tagBot,
        context,
      });
    }
  }
}

getCollectionHooks("Posts").updateAsync.add(async ({oldDocument, newDocument, context}) => {
  if (oldDocument.draft && !newDocument.draft) {
    // Post was undrafted
    void autoApplyTagsTo(newDocument, context);
  }
})
getCollectionHooks("Posts").createAsync.add(async ({document, context}) => {
  if (!document.draft) {
    // Post created (and is not a draft)
    void autoApplyTagsTo(document, context);
  }
})
