import { query } from "express";
import { Posts } from "../../../lib/collections/posts";
import Tags from "../../../lib/collections/tags/collection";
import { PublicInstanceSetting } from "../../../lib/instanceSettings";
import { Globals } from "../../vulcan-lib";

import Anthropic from '@anthropic-ai/sdk';
import groupBy from "lodash/groupBy";
import { time } from "console";
import { generateImage } from "./stablediffusionGeneration";
import Spotlights from "../../../lib/collections/spotlights/collection";

const API_KEY = new PublicInstanceSetting<string>('anthropic.claudeTestKey', "LessWrong", "required")

async function queryClaude(prompt: string) {
  const anthropic = new Anthropic({
    apiKey: API_KEY.get()
  });
  const HUMAN_PROMPT = '\n\nHuman: ';
  const AI_PROMPT = '\n\nAssistant:'
  async function main() {
    const completion = await anthropic.completions.create({
      model: 'claude-1',
      max_tokens_to_sample: 300,
      prompt: `${HUMAN_PROMPT}${prompt}${AI_PROMPT}`,
    });
    return completion.completion
  }
  return await main().catch(err => {
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

async function queryClaudeWithDoc(docId: string, docTitle: string, type: string, prompt: string): Promise<AIResponse> {
  // console.log("querying claude", docId, docTitle, type)
  return { docId, docTitle, type, result: await queryClaude(prompt) }
}

function trimFirstParagraph(text: string) {
  let output = text;
  console.log({ output });
  if (/\n\n/.test(text)) {
    output = text.split("\n\n").at(-1) ?? text.split("\n\n")[1];
  }
  return output
}

function createArtDescription(post: DbPost) {
  const queryImageRoot = `
  Summarize this post. Then describe what would make an effective prompt for Midjourney, an image-generating AI model, to produce an image that corresponds to this post's themes. The image will be small, so it should be relatively simple, such that key elements and themes are easily distinguishable when people see it.

  After doing that, please write three distinct prompts, each two to three sentences long. Each prompt should end with the sentence, "Minimalist aquarelle painting by Thomas Schaller, on a white background." Separate each prompt with a paragraph break. It is very important that your answer ends with the prompts, with no additional commentary.
  `

  return [
    queryClaudeWithDoc(post._id, post.title, "artPrompt", `${queryImageRoot}${post.contents.html}`).then(({ result }) => result),
    queryClaudeWithDoc(post._id, post.title, "artPrompt", `${queryImageRoot}${post.contents.html}`).then(({ result }) => result)
  ]
}

// const querySummaryRoot = `
// Write two sentences that give an idea of what this post is about. Word them from the perspective of the post's author, as if you were just having a conversation with someone about why they might want to read this post. Limit it to JUST two sentences. 

// Also, do NOT include any prefix or preamble to the summary, (i.e. instead of saying "here are two sentences summarizing the post: [summary]", just give the summary itself.
// `

const querySummaryRoot = `
Copy the first paragraph of the this post which is the best standalone introductory paragraph.
`

function createSpotlight(post: DbPost): Array<Promise<any>> {
  
  return [
    queryClaudeWithDoc(post._id, post.title, "summary", `${querySummaryRoot}${post.contents.html}`),
    queryClaudeWithDoc(post._id, post.title, "summary", `${querySummaryRoot}${post.contents.html}`),
  ]
}

async function generateSpotlightImage(prompt: string) {
  const trimmedPrompt = trimFirstParagraph(prompt)
  const combinedPrompt = "Minimalist aquarelle painting by Thomas Schaller, on a white background, " + trimmedPrompt
  // console.log("generating image:\n\n", combinedPrompt)
  return generateImage(combinedPrompt)
}

interface PostResults {
  docTitle: string,
  // artPrompts: string[],
  // artResults: any[],
  summaries: string[]
}

async function createSpotlights() {
  const tag = await Tags.findOne({name: "Best of LessWrong"})
  if (tag) {
    const posts = await Posts.find(
      {[`tagRelevance.${tag._id}`]: {$gt: 0}}
    ).fetch()

    const results: Array<AIResponse> = []
    const start = new Date()

    const spotlightPosts = posts.splice(0,5);

    const postResults: Record<string, PostResults> = {};
    
    for (const post of spotlightPosts) {
      const newResults = await Promise.all(createSpotlight(post))
      // const artPrompts = (await Promise.all(createArtDescription(post))).filter((prompt): prompt is string => !!prompt);
      // const artResults = await Promise.all(artPrompts.map(prompt => generateSpotlightImage(prompt)))

      postResults[post._id] = {
        docTitle: post.title,
        summaries: newResults,
        // artPrompts,
        // artResults
      };
    }
    const apiCompletionTime = (new Date()).getTime() - start.getTime()
    console.log({ apiCompletionTime })
    
    Object.entries(postResults).forEach(([postId, result]) => {
      const { summaries, docTitle } = result;

      console.log({ docTitle })
      console.log({ summaries })
      // console.log({ artPrompts })
      // console.log({ artResults })

      // void Spotlights.rawInsert({
      //   documentId: postId,
      //   documentType: "Post",
      //   draft: true,
      //   duration: 1
      // })
    })
  }
  return "Done"
}

Globals.createSpotlights = createSpotlights;
Globals.queryClaude = queryClaude;
