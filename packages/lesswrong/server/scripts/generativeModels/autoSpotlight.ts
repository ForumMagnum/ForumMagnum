import { Posts } from "../../../lib/collections/posts";
import Tags from "../../../lib/collections/tags/collection";
import { PublicInstanceSetting } from "../../../lib/instanceSettings";
import { Globals, createAdminContext, createMutator } from "../../vulcan-lib";

import Anthropic from '@anthropic-ai/sdk';
import Spotlights from "../../../lib/collections/spotlights/collection";

const API_KEY = new PublicInstanceSetting<string>('anthropic.claudeTestKey', "LessWrong", "required")

async function queryClaude(prompt: string) {
  const anthropic = new Anthropic({
    apiKey: API_KEY.get()
  });
  const HUMAN_PROMPT = '\n\nHuman: ';
  const AI_PROMPT = '\n\nAssistant:'
  async function main() {
    const response = await anthropic.completions.create({
      model: 'claude-1',
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

type AIResponse = {
  docId: string,
  docTitle: string,
  type: string,
  result: string|undefined
}

async function createArtDescription(post: DbPost) {
  const queryImageRoot = `

    Summarize the key ideas in this post in one paragraph. 
    
    Then, in a second paragraph, describe what would make an effective prompt for Midjourney, an image-generating AI model, to produce an image that corresponds to this post's themes. The image will be small, so it should be relatively simple, such that key elements and themes are easily distinguishable when people see it.

    After that, please write a one sentence prompt, ending with the phrase 'Minimalist watercolor painting on a white background, cartographic, diagrammtic --ar 2:1'. The entire prompty should be a single paragraph. It is very important that your answer ends with the prompt, with no additional commentary.

    Write your response as html with paragraph tags.

    Post Title: ${post.title}
  `

  const response = await queryClaude(`${queryImageRoot}${post.contents.html}`)
  return `<p><b>Art Prompt:</b></p>${response}`
}

function createSpotlightDescription(post: DbPost) {
  const querySummaryRoot = `
    Write two sentences that give an idea of what this post is about. Word them from the perspective of the post's author, as if you were just having a conversation with someone about why they might want to read this post. Limit it to JUST two sentences.  Don't use the phrase "the author". Don't use the phrase "the post".
  `
  const queryQuestionRoot = `
    Write two sentences that ask the question that this essay is ultimately answering. (Do not start your with any preamble such as "Here are two sentences:", just write the two sentences)
  `

  const queryBestParagraphRoot = `
    Pick the paragraph from this essay that most encapsulate the idea the essay is abou.(Do not start your with any preamble such as "Here are two sentences:", just write the two sentences)
  `
  const queryFirstParagraphRoot = `
    Pick the first parapgrah from this essay that works as a good introduction. (Just write paragraph, without any preamble)
  `
  return [
    queryClaude(`${querySummaryRoot}${post.contents.html}`),
    queryClaude(`${queryQuestionRoot}${post.contents.html}`),
    queryClaude(`${queryBestParagraphRoot}${post.contents.html}`),
    queryClaude(`${queryFirstParagraphRoot}${post.contents.html}`),
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
  const tag = await Tags.findOne({name: "Best of LessWrong"})
  if (tag) {
    const spotlightDocIds = (await Spotlights.find({}, {projection:{documentId:1}}).fetch()).map(spotlight => spotlight.documentId)

    const posts = await Posts.find(
      {[`tagRelevance.${tag._id}`]: {$gt: 0}}
    ).fetch()

    const spotlightPosts = posts.filter(post => !spotlightDocIds.includes(post._id))

    const postResults: Record<string, string[]> = {};

    for (const [i, post] of Object.entries(spotlightPosts)) {
      // eslint-disable-next-line no-console
      console.log(i, posts.length, post.title)
      const summaries =  await Promise.all([...createSpotlightDescription(post), createArtDescription(post)])
      const filteredSummaries = summaries.filter((prompt): prompt is string => !!prompt);
            
      // const artResults = await Promise.all(artPrompts.map(prompt => generateSpotlightImage(prompt)))
      postResults[post._id] = filteredSummaries
      createSpotlight(post._id, filteredSummaries)
    }
  }
  return "Done"
}

Globals.createSpotlights = createSpotlights;
Globals.queryClaude = queryClaude;
