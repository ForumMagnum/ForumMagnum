import { Globals } from '../../../lib/vulcan-lib/config';
import { getOpenAI, wikiSlugToTemplate, LanguageModelTemplate } from '../../languageModels/languageModelIntegration';
import { postToPrompt, generatePostBodyCache, PostBodyCache } from '../../languageModels/autoTagCallbacks';
import { toDictionary } from '../../../lib/utils/toDictionary';
import { Posts } from '../../../lib/collections/posts/collection';
import { postStatuses } from '../../../lib/collections/posts/constants';
import keyBy from 'lodash/keyBy';
import take from 'lodash/take';
import orderBy from 'lodash/orderBy';
import filter from 'lodash/filter';
import fs from 'fs';


async function generatePostListForEmbeddings(outputFilename: string) {
  const startDate = new Date("2022-06-01");
  const endDate = new Date("2022-11-01");
  
  const posts = await Posts.find({
    draft: false, status: postStatuses.STATUS_APPROVED,
    isFuture: false, unlisted: false, shortform: false, authorIsUnreviewed: false,
    question: false, isEvent: false,
    baseScore: {$gte: 20},
    tagRelevance: {$exists: true},
    postedAt: {$gte: startDate, $lte: endDate},
  }).fetch();
  console.log(`Found ${posts.length} posts`); //eslint-disable-line no-console
  
  const postIds = posts.map(p=>p._id);
  fs.writeFileSync(outputFilename, JSON.stringify(postIds));
}
Globals.generatePostListForEmbeddings = generatePostListForEmbeddings;

async function getPostEmbedding(template: LanguageModelTemplate, post: DbPost): Promise<number[]> {
  const api = await getOpenAI();
  if (!api) throw new Error("OpenAI API unavailable");
  
  const input = await postToPrompt({
    template, post,
    promptSuffix: "",
  });
  
  const embeddingApiResult = await api.createEmbedding({
    model: "text-embedding-ada-002",
    input,
  });
  if (!embeddingApiResult) {
    throw new Error("Failed to retrieve embedding");
  }
  
  return embeddingApiResult.data.data[0].embedding;
}

function vectorNorm(v: number[]) {
  let sumSq = 0;
  for (let i=0; i<v.length; i++)
    sumSq += v[i]*v[i];
  return Math.sqrt(sumSq);
}

function embeddingSimilarity(a: number[], b: number[]): number {
  if(a.length !== b.length) throw new Error("Embeddings are different sizes");
  let dotProduct=0;
  for (let i=0; i<a.length; i++)
    dotProduct += a[i]*b[i];
  return dotProduct / (vectorNorm(a)*vectorNorm(b));
}

async function generateEmbeddings(postIdsFilename: string, outputFilename: string) {
  const postIds = JSON.parse(fs.readFileSync(postIdsFilename, 'utf-8'));
  const openAI = await getOpenAI();
  const embeddings: Record<string,number[]> = {};
  //const template = await wikiSlugToTemplate("lm-config-post-embedding");
  const template: LanguageModelTemplate = {
    header: {
      api: "openai",
      "max-length-tokens": "2040",
      "max-length-truncate-field": "text",
    },
    // eslint-disable-next-line no-template-curly-in-string
    body: '${title}\n${linkpostMeta}\n\n${text}\n',
  };
  
  for (let postId of postIds) {
    const post = await Posts.findOne({_id:postId});
    if (!post) continue;
    embeddings[postId] = await getPostEmbedding(template, post);
  }
  
  fs.writeFileSync(outputFilename, JSON.stringify(embeddings));
}
Globals.generateEmbeddings = generateEmbeddings;

async function generateSimilarities(embeddingsFilename: string, outputFilename: string) {
  const embeddings: Record<string,number[]> = JSON.parse(fs.readFileSync(embeddingsFilename, 'utf-8'));
  const postIds = Object.keys(embeddings);
  const posts = await Posts.find({_id: {$in: postIds}}).fetch();
  const postsById = keyBy(posts, p=>p._id);
  const sb: string[] = [];
  
  function output(s: string) {
    console.log(s); //eslint-disable-line no-console
    sb.push(s);
  }
  
  for (let postId of postIds) {
    const similarities: Partial<Record<string,number>> = toDictionary(postIds,
      otherPostId=>otherPostId,
      otherPostId => {
        const postEmbedding = embeddings[postId];
        const otherPostEmbedding = embeddings[otherPostId];
        return embeddingSimilarity(postEmbedding, otherPostEmbedding);
      }
    );
    const postsExceptSelf = filter(postIds, id=>id!==postId)
    const postsBySimilarity = orderBy(postsExceptSelf, postId => -similarities[postId]!);
    const mostSimilarPostIds = take(postsBySimilarity, 5);
    
    output(`${postsById[postId].title}:`);
    for (let similarPostId of mostSimilarPostIds) {
      output(`    ${postsById[similarPostId].title} ${similarities[similarPostId]}`);
    }
  }
  
  fs.writeFileSync(outputFilename, sb.join('\n'));
}
Globals.generateSimilarities = generateSimilarities;
