import Tags from "../../../lib/collections/tags/collection";
import { anthropicApiKey } from "../../../lib/instanceSettings";
import { Globals, createAdminContext, createMutator } from "../../vulcan-lib";

import Anthropic from '@anthropic-ai/sdk';
import Spotlights from "../../../lib/collections/spotlights/collection";
import { fetchFragment } from "../../fetchFragment";
import ReviewWinners from "@/lib/collections/reviewWinners/collection";
import { Posts } from "@/lib/collections/posts";
import Revisions from "@/lib/collections/revisions/collection";


async function queryClaude(prompt: string) {
  const anthropic = new Anthropic({
    apiKey: anthropicApiKey.get()
  });
  const HUMAN_PROMPT = '\n\nHuman: ';
  const AI_PROMPT = '\n\nAssistant:'
  async function main() {
    const response = await anthropic.completions.create({
      model: 'claude-3-5-sonnet-20240620',
      max_tokens_to_sample: 300,
      prompt: `${HUMAN_PROMPT}${prompt}${AI_PROMPT}`,
    });
    return response.completion
  }
  return await main().catch(err => {
    // eslint-disable-next-line no-console
    console.error(err);
    return undefined;
  });
}

function createSpotlightDescriptionPrompt(post: PostsPage) {

  return `
    Write a short description of this essay.
  `
}

function createSpotlightDescription(post: PostsPage, spotlightPosts: PostsPage[], spotlights: DbSpotlight[]) {


  const queryQuestionRoot = `
    Write two sentences that ask the question that this essay is ultimately answering. (Do not start your with any preamble such as "Here are two sentences:", just write the two sentences)
  `
  const queryBestParagraphRoot = `
    Pick the paragraph from this essay that most encapsulate the idea the essay is about.(Do not start your with any preamble such as "Here is a pagraph:", just copy the paragraph itself)
  `
  const queryBestQuestionParagraphRoot = `
    Pick the paragraph from this essay that most encapsulates the question this post is trying to answer.(Do not start your with any preamble such as "Here is a paragraph:", just write the paragraph)
  `
  const queryFirstParagraphRoot = `
    Pick the first paragraph from the essay that isn't some kind of metadata. (Just write paragraph, without any preamble)
  `
  return [
    queryClaude(`${queryQuestionRoot}${post.contents?.html}`),
    queryClaude(`${queryBestQuestionParagraphRoot}${post.contents?.html}`),
    queryClaude(`${queryBestParagraphRoot}${post.contents?.html}`),
    queryClaude(`${queryFirstParagraphRoot}${post.contents?.html}`),
  ]
}

function createSpotlight (postId: string, summaries: string[]) {
  const description = summaries.map(summary => `<p>${summary}</p>`).join("")
  const context = createAdminContext();
  void createMutator({
    collection: Spotlights,
    document: {
      documentId: postId,
      documentType: "Post",
      duration: 1,
      draft: true,
      showAuthor: true,
      description: { originalContents: { type: 'ckEditorMarkup', data: description } },
      lastPromotedAt: new Date(0),
    },
    currentUser: context.currentUser,
    context
  })
}


async function createSpotlights() {
  console.log("Creating spotlights for review winners");

  const reviewWinners = await ReviewWinners.find({}).fetch();
  
  const postIds = reviewWinners.map(winner => winner.postId);
  
  const posts = await Posts.find({ _id: { $in: postIds } }).fetch();
  const postRevisionContents = await Revisions.find({ documentId: { $in: postIds }, collectionName: "Posts", fieldName: "contents" }).fetch();
  const spotlights = await Spotlights.find({ documentId: { $in: postIds } }).fetch();

  const postsWithoutSpotlight = posts.filter(post => !spotlights.find(spotlight => spotlight.documentId === post._id))

  let context = ""

  for (const spotlight of spotlights.slice(0, 2)) {
    const post = posts.find(post => post._id === spotlight.documentId)
    const postRevision = postRevisionContents.find(revision => revision.documentId === spotlight.documentId)
    context += `
      Post: ${post?.title}
      ---
      Post Contents: ${postRevision?.originalContents?.data}
      ---
      Spotlight: ${spotlight.description?.originalContents?.data}
      ---
      ---
      ---
    `
  }
  const queries = postsWithoutSpotlight.slice(0, 2).map(post => {
    const query = context += `
      Post: ${post.title}
      ---
      Post Contents: ${postRevisionContents.find(revision => revision.documentId === post._id)?.originalContents?.data}
      ---
      What is a short description that would best describe this essay?
    `
    return query
  })
  const summaries = await Promise.all(queries.map(query => queryClaude(query)))

  console.log(summaries[0])

  // Further processing of posts can be done here
  // For example, you could call createSpotlightDescription for each post
}





async function createSpotlightsOld() {
  console.log("Creating spotlights")
  const tag = await Tags.findOne({name: "Best of LessWrong"})



  if (tag) {
    const spotlights = (await Spotlights.find({}, {projection:{documentId:1}}).fetch())
    const spotlightDocIds = spotlights.map(spotlight => spotlight.documentId)

    const posts = await fetchFragment({
      collectionName: "Posts",
      fragmentName: "PostsPage",
      currentUser: null,
      selector: {[`tagRelevance.${tag._id}`]: {$gt: 0}},
      skipFiltering: true,
    });

    const spotlightPosts = posts.filter(post => !spotlightDocIds.includes(post._id))

    const postResults: Record<string, string[]> = {};

    for (const [i, post] of Object.entries(spotlightPosts)) {
      // eslint-disable-next-line no-console
      console.log(i, spotlightPosts.length, post.title)
      const summaries =  await Promise.all([...createSpotlightDescription(post, spotlightPosts, spotlights)])
      // const filteredSummaries = summaries.filter((prompt): prompt is string => !!prompt);
            
      // // const artResults = await Promise.all(artPrompts.map(prompt => generateSpotlightImage(prompt)))
      // postResults[post._id] = filteredSummaries
      // createSpotlight(post._id, filteredSummaries)
    }
  }
  return "Done"
}

Globals.createSpotlights = createSpotlights;
Globals.queryClaude = queryClaude;
