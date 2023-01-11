import { Globals } from '../../../lib/vulcan-lib/config';
import { getOpenAI, wikiSlugToTemplate, LanguageModelTemplate } from '../../languageModels/languageModelIntegration';
import { postToPrompt, generatePostBodyCache, PostBodyCache } from '../../languageModels/autoTagCallbacks';
import { toDictionary } from '../../../lib/utils/toDictionary';
import { Posts } from '../../../lib/collections/posts/collection';
import { postStatuses } from '../../../lib/collections/posts/constants';
import { getPostEmbedding } from '../../languageModels/postSimilarity';
import { cosineSimilarity } from '../../utils/vectorUtil';
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
    const {embeddingType, embeddingVector} = await getPostEmbedding(template, post);
    embeddings[postId] = embeddingVector;
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
        return cosineSimilarity(postEmbedding, otherPostEmbedding);
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
