import { Posts } from '../../../server/collections/posts/collection';
import { Tags } from '../../../server/collections/tags/collection';
import { postStatuses } from '../../../lib/collections/posts/constants';
import { getOpenAI, wikiSlugToTemplate } from '../../languageModels/languageModelIntegration';
import { postToPrompt, checkTags, getAutoAppliedTags, generatePostBodyCache, PostBodyCache } from '../../languageModels/autoTagCallbacks';
import shuffle from 'lodash/shuffle';
import take from 'lodash/take';
import drop from 'lodash/drop';
import sum from 'lodash/sum';
import keyBy from 'lodash/keyBy';
import filter from 'lodash/filter';
import fs from 'fs';
import { getSiteUrl } from '../../../lib/vulcan-lib/utils';
import { FetchedFragment, fetchFragment } from '../../fetchFragment';
import { createAnonymousContext } from '@/server/vulcan-lib/query';

const postEndMarker  = "===TAGS===";

/**
 * Given a list of items and a list of weights, shuffle and partition the items
 * into disjoint sets with size proportional to weight. Used for dividing data
 * into train and test.
 * Exported to allow running with "yarn repl"
 */
export function weightedPartition<T>(list: T[], weights: number[]): T[][]
{
  const totalWeight = sum(weights);
  
  // First calculate group sizes with everything rounded down.
  let groupSizes: number[] = weights.map(groupWeight => Math.floor((groupWeight/totalWeight) * list.length));
  
  // Allocate any remaining items arbitrarily
  const oddItems = list.length - sum(groupSizes);
  for (let i=0; i<oddItems; i++)
    groupSizes[i]++;
  
  // Shuffle
  let shuffledList = shuffle(list);
  
  // Partition the shuffled list into groups of the specified sizes
  let result: T[][] = [];
  for (let groupSize of groupSizes) {
    let group = take(shuffledList, groupSize);
    shuffledList = drop(shuffledList, groupSize);
    result.push(group);
  }
  
  return result;
}

// Exported to allow running with "yarn repl"
export async function generateCandidateSetsForTagClassification(): Promise<void> {
  const startDate = new Date("2022-11-01");
  const endDate = new Date("2023-11-01");
  
  console.log(`Finding posts from ${startDate} to ${endDate}`); //eslint-disable-line no-console
  const posts = await Posts.find({
    draft: false, status: postStatuses.STATUS_APPROVED,
    isFuture: false, unlisted: false, shortform: false, authorIsUnreviewed: false,
    question: false, isEvent: false,
    // FIXME `contents: {$ne: null}` now throws an error due to contents being normalized
    contents: {$ne: null},
    baseScore: {$gte: 10},
    tagRelevance: {$exists: true},
    postedAt: {$gte: startDate, $lte: endDate},
  }).fetch();
  console.log(`Found ${posts.length} posts`); //eslint-disable-line no-console
  
  const postIds = posts.map(post => post._id);
  const [trainSet,testSet] = weightedPartition(postIds, [2.0/3.0, 1.0/3.0]);
  console.log(`Partitioned into ${trainSet.length} train and ${testSet.length} test`); //eslint-disable-line no-console
  
  const trainSetFilename = "ml/tagClassificationPostIds.train.json";
  const testSetFilename = "ml/tagClassificationPostIds.test.json";
  if (!fs.existsSync("ml")) {
    fs.mkdirSync("ml");
  }
  fs.writeFileSync(trainSetFilename, JSON.stringify(trainSet));
  fs.writeFileSync(testSetFilename, JSON.stringify(testSet));
  console.log(`Wrote ${trainSetFilename} and ${testSetFilename}`); //eslint-disable-line no-console
}

const frontpageModel = "babbage:ft-personal-2022-12-08-22-23-33";
const frontpagePrompt = "Is this post of broad relevance, timeless, apolitical, and aiming to explain rather than persuade?";

async function generateClassifierTuningFile({description, posts, postBodyCache, outputFilename, promptSuffix, classifyPost}: {
  description: string,
  posts: FetchedFragment<"PostsHTML">[],
  outputFilename: string,
  promptSuffix: string,
  classifyPost: (post: DbPost) => boolean,
  postBodyCache?: PostBodyCache
}) {
  const context = createAnonymousContext();
  const postsById = keyBy(posts, post=>post._id);
  const result: string[] = [];
  const template = await wikiSlugToTemplate("lm-config-autotag", context);
  
  let postsWritten = 0;
  
  for (let post of posts) {
    //try {
      const prompt = await postToPrompt({ template, post, promptSuffix, postBodyCache });
      const hasTag = classifyPost(post);
      
      result.push(JSON.stringify({
        prompt,
        completion: hasTag ? " yes" : " no",
      }));
      
      postsWritten++;
    //} catch(e) {
      //console.log(`Error formatting post ${post._id} for finetune training: ${e}`); //eslint-disable-line no-console
    //}
  }
  
  console.log(`Writing ${description} to ${outputFilename}`); //eslint-disable-line no-console
  fs.writeFileSync(outputFilename, result.join('\n'));
}

// Exported to allow running with "yarn repl"
export const generateTagClassifierData = async (args: {
  tagSlug?: string
  trainingSetFilename?: string,
  testSetFilename?: string,
}) => {
  const context = createAnonymousContext();
  const {tagSlug, trainingSetFilename="ml/tagClassificationPostIds.train.json", testSetFilename="ml/tagClassificationPostIds.test.json"} = args||{};
  const trainingSetPostIds = JSON.parse(fs.readFileSync(trainingSetFilename, 'utf-8'));
  const testSetPostIds = JSON.parse(fs.readFileSync(testSetFilename, 'utf-8'));

  const trainingSet = await fetchFragment({
    collectionName: "Posts",
    fragmentName: "PostsHTML",
    selector: {_id: {$in: trainingSetPostIds}},
    currentUser: null,
    skipFiltering: true,
  });
  const testSet = await fetchFragment({
    collectionName: "Posts",
    fragmentName: "PostsHTML",
    selector: {_id: {$in: testSetPostIds}},
    currentUser: null,
    skipFiltering: true,
  });

  const singleTag = tagSlug ? await Tags.findOne({slug: tagSlug}) : null;
  if (tagSlug && !singleTag) throw new Error(`Missing tag: ${tagSlug}`);
  
  const tags: DbTag[] = tagSlug
    ? [singleTag!]
    : await getAutoAppliedTags(context);
  
  console.log(`Will generate training and test sets for ${tags.length} tags: ${tags.map(t=>t.slug).join(', ')}`); //eslint-disable-line no-console
  console.log(`Preprocessing post body for ${trainingSet.length} posts in training set`); //eslint-disable-line no-console
  const postBodyCacheTrain = generatePostBodyCache(trainingSet);
  console.log(`Preprocessing post body for ${testSet.length} posts in test set`); //eslint-disable-line no-console
  const postBodyCacheTest = generatePostBodyCache(testSet);
  
  for (let tag of tags) {
    //eslint-disable-next-line no-console
    console.log(`Generating tag training/test sets for tag ${tag.name}`);
    const tagPrompt = tag.autoTagPrompt;
    if (!tagPrompt) continue; // This actually comes from a query that filters it to be nonempty but the type system doesn't know that
    
    await generateClassifierTuningFile({
      description: `Train tag ${tag.slug}: ${tagPrompt}`,
      posts: trainingSet,
      postBodyCache: postBodyCacheTrain,
      outputFilename: `ml/tagClassification.${tag.slug}.train.jsonl`,
      promptSuffix: tagPrompt,
      classifyPost: (post: DbPost) => (
        post.tagRelevance
        && tag._id in post.tagRelevance
        && post.tagRelevance[tag._id] > 0
      )
    });
    await generateClassifierTuningFile({
      description: `Test tag ${tag.slug}: ${tagPrompt}`,
      posts: testSet,
      postBodyCache: postBodyCacheTest,
      outputFilename: `ml/tagClassification.${tag.slug}.test.jsonl`,
      promptSuffix: tagPrompt,
      classifyPost: (post: DbPost) => (
        post.tagRelevance
        && tag._id in post.tagRelevance
        && post.tagRelevance[tag._id] > 0
      )
    });
  }
}

// Exported to allow running with "yarn repl"
export const generateIsFrontpageClassifierData = async () => {
  const trainingSetFilename = "ml/tagClassificationPostIds.train.json";
  const testSetFilename = "ml/tagClassificationPostIds.test.json";
  
  const trainingSetPostIds = JSON.parse(fs.readFileSync(trainingSetFilename, 'utf-8'));
  const testSetPostIds = JSON.parse(fs.readFileSync(testSetFilename, 'utf-8'));

  const trainingSet = await fetchFragment({
    collectionName: "Posts",
    fragmentName: "PostsHTML",
    selector: {_id: {$in: trainingSetPostIds}},
    currentUser: null,
    skipFiltering: true,
  });
  const testSet = await fetchFragment({
    collectionName: "Posts",
    fragmentName: "PostsHTML",
    selector: {_id: {$in: testSetPostIds}},
    currentUser: null,
    skipFiltering: true,
  });

  await generateClassifierTuningFile({
    description: `Train is-front-page`,
    posts: trainingSet,
    outputFilename: `ml/tagClassification.frontpage.train.jsonl`,
    promptSuffix: frontpagePrompt,
    classifyPost: (post: DbPost) => (
      !!post.frontpageDate
    )
  });
  await generateClassifierTuningFile({
    description: `Test is-tag front-page`,
    posts: testSet,
    outputFilename: `ml/tagClassification.frontpage.test.jsonl`,
    promptSuffix: frontpagePrompt,
    classifyPost: (post: DbPost) => (
      !!post.frontpageDate
    )
  });
}

// Exported to allow running with "yarn repl"
export const evaluateTagModels = async (testSetPostIdsFilename: string, outputFilename: string) => {
  const context = createAnonymousContext();
  const testSetPostIds = JSON.parse(fs.readFileSync(testSetPostIdsFilename, 'utf-8'));
  const posts = await fetchFragment({
    collectionName: "Posts",
    fragmentName: "PostsHTML",
    selector: {_id: {$in: testSetPostIds}},
    currentUser: null,
    skipFiltering: true,
  });
  const tags = await getAutoAppliedTags(context);
  const openAIApi = await getOpenAI();
  if (!openAIApi) throw new Error("OpenAI API not configured");
  const sb: string[] = [];
  
  function writeResult(text: string) {
    console.log(text); // eslint-disable-line no-console
    sb.push(text);
  }
  
  for (let post of shuffle(posts)) {
    const tagsByHumans = filter(tags, t=>post.tagRelevance?.[t._id] > 0).map(t=>t.name);
    
    try {
      const tagsPredicted = await checkTags(post, tags, openAIApi, context);
      
      writeResult(`${post.title}\n`
        + `    ${getSiteUrl()}/posts/${post._id}/${post.slug}\n`
        + `    Language model: ${filter(tags, t=>!!tagsPredicted[t.slug]).map(t=>t.name).join(", ")}\n`
        + `    Human: ${tagsByHumans.join(", ")}\n`
      );
    } catch(e) {
      writeResult(`${post._id} ${post.title}\n`
        + `    Language model: ERROR\n`
        + `    Human: ${tagsByHumans.join(", ")}\n`
      );
    }
  }
  
  fs.writeFileSync(outputFilename, sb.join(''));
}

// Exported to allow running with "yarn repl"
export const evaluateFrontPageClassifier = async (testSetPostIdsFilename: string, outputFilename: string) => {
  const context = createAnonymousContext();
  const testSetPostIds = JSON.parse(fs.readFileSync(testSetPostIdsFilename, 'utf-8'));
  const template = await wikiSlugToTemplate("lm-config-autotag", context);
  const posts = await fetchFragment({
    collectionName: "Posts",
    fragmentName: "PostsHTML",
    selector: {_id: {$in: testSetPostIds}},
    currentUser: null,
    skipFiltering: true,
  });
  const postsById = keyBy(posts, post=>post._id);
  const openAIApi = await getOpenAI();
  if (!openAIApi) throw new Error("OpenAI API not configured");
  let humanFrontpagedIt: Record<string,boolean> = {};
  let languageModelFrontpagedIt: Record<string,boolean> = {};
  let languageModelHadError: Record<string,boolean> = {};
  
  function writeResult(text: string) {
    console.log(text); // eslint-disable-line no-console
    sb.push(text);
  }
  
  console.log(`Evaluating front-page classification for ${posts.length} posts`); //eslint-disable-line no-console
  for (let post of shuffle(posts)) {
    humanFrontpagedIt[post._id] = !!post.frontpageDate;
    try {
      const languageModelResult = await openAIApi.completions.create({
        model: frontpageModel,
        prompt: await postToPrompt({template, post, promptSuffix: frontpagePrompt}),
        max_tokens: 1,
      });
      const completion = languageModelResult.choices[0].text!;
      const isFrontpage = (completion.trim().toLowerCase() === "yes");
      languageModelFrontpagedIt[post._id] = isFrontpage;
    } catch(e) {
      languageModelHadError[post._id] = true;
    }
  }
  
  console.log(`Finished evaluations.`); //eslint-disable-line no-console
  
  const sb: string[] = [];
  const agreements = filter(testSetPostIds, postId=>languageModelFrontpagedIt[postId]===humanFrontpagedIt[postId]);
  const onlyHumanFrontpaged = filter(testSetPostIds, postId=>!languageModelFrontpagedIt[postId] && humanFrontpagedIt[postId]);
  const onlyLMFrontpaged = filter(testSetPostIds, postId=>languageModelFrontpagedIt[postId] && !humanFrontpagedIt[postId]);
  sb.push(`Human and LM agree: ${agreements.length}\n`);
  sb.push(`Only human front-paged it: ${onlyHumanFrontpaged.length}\n`);
  sb.push(`Only LM front-paged it: ${onlyLMFrontpaged.length}\n`);
  sb.push('\n');
  
  function listPosts(postIds: string[]) {
    return postIds.map(postId => {
      const post = postsById[postId];
      return `    ${post.title} - https://wwww.lesswrong.com/posts/${post._id}/${post.slug}\n`
    }).join("");
  }
  sb.push('Human front paged:\n');
  sb.push(listPosts(onlyHumanFrontpaged));
  sb.push('LM front paged:\n');
  sb.push(listPosts(onlyLMFrontpaged));
  sb.push('Agreed:\n');
  sb.push(listPosts(agreements));
  sb.push('LM encountered error:\n');
  sb.push(listPosts(filter(testSetPostIds, postId=>languageModelHadError[postId])));
  fs.writeFileSync(outputFilename, sb.join(''));
}


// Exported to allow running with "yarn repl"
export async function printLanguageModelTemplate(templateName: string) {
  const context = createAnonymousContext();
  const template = await wikiSlugToTemplate("lm-config-autotag", context);
  //eslint-disable-next-line no-console
  console.log(JSON.stringify(template));
}

