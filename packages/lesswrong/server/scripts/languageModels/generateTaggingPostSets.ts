import { Globals } from '../../../lib/vulcan-lib/config';
import { Posts } from '../../../lib/collections/posts/collection';
import { Tags } from '../../../lib/collections/tags/collection';
import { truncate } from '../../../lib/editor/ellipsize';
import { postStatuses } from '../../../lib/collections/posts/constants';
import { dataToMarkdown, htmlToMarkdown } from '../../editor/conversionUtils';
import { getOpenAI } from '../../languageModels/languageModelIntegration';
import { cheerioParse } from '../../utils/htmlUtil';
import type { OpenAIApi } from "openai";
import shuffle from 'lodash/shuffle';
import take from 'lodash/take';
import drop from 'lodash/drop';
import sum from 'lodash/sum';
import keyBy from 'lodash/keyBy';
import mapValues from 'lodash/mapValues';
import filter from 'lodash/filter';
import fs from 'fs';

const bodyWordCountLimit = 1500;
const postEndMarker  = "===TAGS===";
const nextPostMarker = "END";

/**
 * Given a list of items and a list of weights, shuffle and partition the items
 * into disjoint sets with size proportional to weight. Used for dividing data
 * into train and test.
 */
function weightedPartition<T>(list: T[], weights: number[]): T[][]
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

async function generateCandidateSetsForTagClassification(): Promise<void> {
  const startDate = new Date("2021-01-01");
  const endDate = new Date("2022-11-01");
  
  console.log(`Finding posts from ${startDate} to ${endDate}`); //eslint-disable-line no-console
  const posts = await Posts.find({
    draft: false, status: postStatuses.STATUS_APPROVED,
    isFuture: false, unlisted: false, shortform: false, authorIsUnreviewed: false,
    question: false, isEvent: false,
    baseScore: {$gte: 10},
    tagRelevance: {$exists: true},
    postedAt: {$gte: startDate, $lte: endDate},
  }).fetch();
  console.log(`Found ${posts.length} posts`); //eslint-disable-line no-console
  
  const postIds = posts.map(post => post._id);
  const [trainSet,testSet] = weightedPartition(postIds, [2.0/3.0, 1.0/3.0]);
  console.log(`Partitioned into ${trainSet.length} train and ${testSet.length} test`); //eslint-disable-line no-console
  
  const trainSetFilename = "tagClassificationPostIds.train.json";
  const testSetFilename = "tagClassificationPostIds.test.json";
  fs.writeFileSync(trainSetFilename, JSON.stringify(trainSet));
  fs.writeFileSync(testSetFilename, JSON.stringify(testSet));
  console.log(`Wrote ${trainSetFilename} and ${testSetFilename}`); //eslint-disable-line no-console
}

const postTruncatedBodyCache: Record<string,string> = {};

function stripLinksFromHTML(html: string): string {
  return html; // TODO
}

function postToPrompt(post: DbPost, promptSuffix: string): string {
  if (!(post._id in postTruncatedBodyCache)) {
    //const html = post.contents?.html;
    //const withLinksStripped = stripLinksFromHTML(html);
    //const markdownPostBody = htmlToMarkdown(withLinksStripped);
    const markdownPostBody = dataToMarkdown(post.contents?.originalContents?.data, post.contents?.originalContents?.type);
    const truncatedPostBody = truncate(markdownPostBody, bodyWordCountLimit, "words", "...").substring(0,3000);
    postTruncatedBodyCache[post._id] = truncatedPostBody;
  }
  return `${post.title}\n\n${postTruncatedBodyCache[post._id]}\n\n${promptSuffix}`;
}

const tagClassifiers = {
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
};
const tagsToClassifySlugs = Object.keys(tagClassifiers);

async function generateFineTuningFile(postIdsFilename: string, outputFilename: string): Promise<void> {
  const postIds = JSON.parse(fs.readFileSync(postIdsFilename, 'utf-8'));
  const posts = await Posts.find({_id: {$in: postIds}}).fetch();
  const postsById = keyBy(posts, post=>post._id);
  const result: string[] = [];
  
  const tagsToClassify = await Tags.find({slug: {$in: tagsToClassifySlugs}}).fetch();
  const tagsBySlug = keyBy(tagsToClassify, tag=>tag.slug);
  
  let numPostsWithTag = mapValues(tagsBySlug, t=>0);
  let postsWritten = 0;
  
  for (let postId of postIds) {
    try {
      const post = postsById[postId];
      const prompt = postToPrompt(post, postEndMarker);
      
      let tagsCompletion = "";
      for (let tagSlug of tagsToClassifySlugs) {
        const tag = tagsBySlug[tagSlug]
        const hasTag = (tag._id in post.tagRelevance) && (post.tagRelevance[tag._id] > 0);
        if (hasTag) numPostsWithTag[tagSlug]++;
        tagsCompletion += `${tag.name}: ${hasTag ? "Yes" : "No"}\n`;
      }
      
      result.push(JSON.stringify({
        prompt,
        completion: tagsCompletion,
      }));
      
      postsWritten++;
    } catch(e) {
      console.log(`Error formatting post ${postId} for finetune training: ${e}`); //eslint-disable-line no-console
    }
  }
  
  for (let tagSlug of tagsToClassifySlugs) {
    console.log(`Posts with tag ${tagSlug}: ${numPostsWithTag[tagSlug] / postsWritten}`); //eslint-disable-line no-console
  }
  
  fs.writeFileSync(outputFilename, result.join('\n'));
}

async function getCompletionsWithFinetune(finetuneId: string, postIdsFilename: string, outputFilename: string): Promise<void> {
  const postIds = JSON.parse(fs.readFileSync(postIdsFilename, 'utf-8'));
  const posts = await Posts.find({_id: {$in: postIds}}).fetch();
  const results: string[] = [];
  const openAIApi = await getOpenAI();
  if (!openAIApi) throw new Error("OpenAI API is not configured");
  
  for (let post of posts) {
    const prompt = postToPrompt(post, postEndMarker);
    const result = await openAIApi.createCompletion({
      model: finetuneId,
      prompt,
    });
    const completion = result.data.choices[0].text;
    console.log(`Completion for post ${post._id} (title ${post.title}): ${completion}`); //eslint-disable-line no-console
    // TODO
  }
  
  //fs.writeFileSync(outputFilename, results.join("\n"));
}

async function generateClassifierTuningFile({description, posts, outputFilename, promptSuffix, classifyPost}: {
  description: string,
  posts: DbPost[],
  outputFilename: string,
  promptSuffix: string,
  classifyPost: (post: DbPost)=>boolean,
}) {
  const postsById = keyBy(posts, post=>post._id);
  const result: string[] = [];
  
  let postsWritten = 0;
  
  for (let post of posts) {
    try {
      const prompt = postToPrompt(post, promptSuffix);
      const hasTag = classifyPost(post);
      
      result.push(JSON.stringify({
        prompt,
        completion: hasTag ? " yes" : " no",
      }));
      
      postsWritten++;
    } catch(e) {
      console.log(`Error formatting post ${post._id} for finetune training: ${e}`); //eslint-disable-line no-console
    }
  }
  
  console.log(`Writing ${description} to ${outputFilename}`); //eslint-disable-line no-console
  fs.writeFileSync(outputFilename, result.join('\n'));
}

Globals.generateTagClassifierData = async () => {
  const trainingSetFilename = "ml/tagClassificationPostIds.train.json";
  const testSetFilename = "ml/tagClassificationPostIds.test.json";
  
  const trainingSetPostIds = JSON.parse(fs.readFileSync(trainingSetFilename, 'utf-8'));
  const testSetPostIds = JSON.parse(fs.readFileSync(testSetFilename, 'utf-8'));
  
  const trainingSet: DbPost[] = await Posts.find({_id: {$in: trainingSetPostIds}}).fetch();
  const testSet: DbPost[] = await Posts.find({_id: {$in: testSetPostIds}}).fetch();
  
  
  const tags = await Tags.find({slug: {$in: tagsToClassifySlugs}}).fetch();
  
  for (let tag of tags) {
    const tagPrompt = "\n\n###\n\n" + tagClassifiers[tag.slug].prompt;
    
    await generateClassifierTuningFile({
      description: `Train tag ${tag.slug}: ${tagPrompt}`,
      posts: trainingSet,
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

async function checkTags(post: DbPost, tags: DbTag[], openAIApi: OpenAIApi) {
  let tagsApplied = {};
  
  for (let tag of tags) {
    const languageModelResult = await openAIApi.createCompletion({
      model: tagClassifiers[tag.slug].finetuneModel,
      prompt: postToPrompt(post, '\n\n###\n\n' + tagClassifiers[tag.slug].prompt),
      max_tokens: 1,
    });
    const completion = languageModelResult.data.choices[0].text!;
    const hasTag = (completion.trim().toLowerCase() === "yes");
    tagsApplied[tag.slug] = hasTag;
  }
  
  return tagsApplied;
}

Globals.evaluateTagModels = async (testSetPostIdsFilename: string, outputFilename: string) => {
  const testSetPostIds = JSON.parse(fs.readFileSync(testSetPostIdsFilename, 'utf-8'));
  const posts = await Posts.find({_id: {$in: testSetPostIds}}).fetch();
  const tags = await Tags.find({slug: {$in: Object.keys(tagClassifiers)}}).fetch();
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
      const tagsPredicted = await checkTags(post, tags, openAIApi);
      
      writeResult(`${post.title}\n`
        + `    https://www.lesswrong.com/posts/${post._id}/${post.slug}\n`
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

Globals.weightedPartition = weightedPartition;
Globals.generateCandidateSetsForTagClassification = generateCandidateSetsForTagClassification;
Globals.generateFineTuningFile = generateFineTuningFile;
Globals.getCompletionsWithFinetune = getCompletionsWithFinetune;
