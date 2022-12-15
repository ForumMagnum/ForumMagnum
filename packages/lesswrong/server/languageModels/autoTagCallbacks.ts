import { getOpenAI, wikiPageToTemplate, substituteIntoTemplate } from './languageModelIntegration';
import { CreateCallbackProperties, getCollectionHooks, UpdateCallbackProperties } from '../mutationCallbacks';
import { truncate } from '../../lib/editor/ellipsize';
import { dataToMarkdown, htmlToMarkdown } from '../editor/conversionUtils';
import type { OpenAIApi } from "openai";
import { Tags } from '../../lib/collections/tags/collection';
import { addOrUpvoteTag } from '../tagging/tagsGraphQL';
import { DatabaseServerSetting } from '../databaseSettings';
import { Users } from '../../lib/collections/users/collection';

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
 *       ${title}
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
 *    database server setting `languageModels.openai.apiKey`.
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
 *    node to have a heap-size limit larger than the default of 4GB with:
 *        export NODE_OPTIONS="--max-old-space-size=16000"
 *    This will generate two files for each tag,
 *        named ml/tagClassification.TAG.{train,test}.jsonl
 *    Take a look at a few of these and make sure they look right.
 *
 * 7.
 */

const bodyWordCountLimit = 1500;
const tagBotAccountSlug = new DatabaseServerSetting<string|null>('languageModels.autoTagging.taggerAccountSlug', null);

/*export const tagClassifiers = {
  "rationality": {
    prompt: "Is this post about rationality techniques, reasoning techniques, heuristics and biases, or something widely applicable?",
    finetuneModel: "babbage:ft-personal-2022-12-07-21-47-36",
    finetuneID: "ft-USVX58sWUQPzgYd46Bc86nrr",
  },
  "world-modeling": {
    prompt: "Is this post about understanding something in the physical world, excluding rationality techniques and AI?",
    finetuneModel: "babbage:ft-personal-2022-12-08-02-41-08",
    finetuneID: "ft-i1awtIVhtHdGgen0j5I8CPWG",
  },
  "world-optimization": {
    prompt: "Is this post about strategies for being more effective, making the world better, or acquiring leverage?",
    finetuneModel: "babbage:ft-personal-2022-12-08-03-43-09",
    finetuneID: "ft-1aQFhsCwx97oySUTBXFlq0Uw",
  },
  "community": {
    prompt: "Is this post about the rationalist community dynamics, events, people or gossip?",
    finetuneModel: "babbage:ft-personal-2022-12-08-01-40-46",
    finetuneID: "ft-m8qvYbS6EbnagXVz418N1KaB",
  },
  "practical": {
    prompt: "Is this post about something you could apply in day to day life, life hacks, or productivity techniques?",
    finetuneModel: "babbage:ft-personal-2022-12-07-22-48-29",
    finetuneID: "ft-o9jEgvlssJxABgig6VrIS0ex",
  },
  "ai": {
    prompt: "Is this post about artificial intelligence or machine learning?",
    finetuneModel: "babbage:ft-personal-2022-12-07-07-55-15",
    finetuneID: "ft-Zm4L7U6LP3Izt4q4qGMAYmXs",
  },
  "covid-19": {
    prompt: "Is this post about the COVID-19 pandemic?",
    finetuneModel: "babbage:ft-personal-2022-12-07-23-49-16",
    finetuneID: "ft-c7fWn5rmGIGtHZzDaUwLaN3C",
  },
};*/

/**
 * Strip links from HTML, for purposes of preparing a post to feed into a language
 * model for classification. We do this prior to Markdown conversion, so that
 * links don't chew up too much of the context window/length limit.
 */
function stripLinksFromHTML(html: string): string {
  return html; // TODO
}

export async function postToPrompt(post: DbPost, promptSuffix: string): Promise<string> {
  const wikiConfig = await Tags.findOne({slug: "lm-config-autotag"});
  if (!wikiConfig) throw new Error("No LM config page for autotagging");
  const {header, template} = wikiPageToTemplate(wikiConfig);
  
  const markdownPostBody = dataToMarkdown(post.contents?.originalContents?.data, post.contents?.originalContents?.type);
  //const truncatedPostBody = truncate(markdownPostBody, bodyWordCountLimit, "words", "...").substring(0,3000);
  return substituteIntoTemplate({
    template,
    maxLengthTokens: parseInt(header["max-length-tokens"]),
    truncatableVariable: "text",
    variables: {
      title: post.title,
      text: markdownPostBody,
      tagPrompt: promptSuffix,
    }
  });
}

export async function checkTags(post: DbPost, tags: DbTag[], openAIApi: OpenAIApi) {
  let tagsApplied = {};
  
  for (let tag of tags) {
    const languageModelResult = await openAIApi.createCompletion({
      model: tag.autoTagModel,
      prompt: await postToPrompt(post, tag.autoTagPrompt),
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

export async function getAutoAppliedTags(): Promise<DbTag[]> {
  return await Tags.find({ autoTagPrompt: {$exists: true, $ne: ""} }).fetch();
}

async function autoApplyTagsTo(post: DbPost, context: ResolverContext): Promise<void> {
  const api = await getOpenAI();
  if (!api) return;
  const tagBot = await getTagBotAccount(context);
  if (!tagBot) return;
  
  const tags = await getAutoAppliedTags();
  
  //eslint-disable-next-line no-console
  console.log(`Auto-applying tags to post ${post.title} (${post._id})`);
  
  const tagsApplied = await checkTags(post, tags, api);
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
