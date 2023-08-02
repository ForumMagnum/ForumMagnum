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
  return await main().catch(console.error);
}

type AIResponse = {
  docId: string,
  docTitle: string,
  type: string,
  result: string|void
}

async function queryClaudeWithDoc(docId: string, docTitle: string, type: string, prompt: string): Promise<AIResponse> {
  console.log("querying claude", docId, docTitle, type)
  return { docId, docTitle, type, result: await queryClaude(prompt) }
}

function trimFirstParagraph(text: string) {
  let output = text;
  if (/\n\n/.test(text)) {
    output = text.split("\n\n")[1];
  }
  return output
}

function createSpotlight(post: DbPost): Array<Promise<any>> {
  const querySummaryRoot = `
    Write two sentences that give an idea of what this post is about. Word them from the perspective of the post's author, as if you were just having a conversation with someone about why they might want to read this post. Limit it to JUST two sentences. 
    
    Also, do NOT include any prefix or preamble to the summary, (i.e. instead of saying "here are two sentences summarizing the post: [summary]", just give the summary itself.
  `
  const queryImageRoot = `
    Write a short description of a painting related to this post. It should be about 10 words long. It can be written in approx. 3-word sentence fragments, separated by commas. Each fragment should describe a different aspect of the art piece's subject or setting.
  `
  return [
    queryClaudeWithDoc(post._id, post.title, "summary", `${querySummaryRoot}${post.contents.html}`),
    queryClaudeWithDoc(post._id, post.title, "summary", `${querySummaryRoot}${post.contents.html}`),
    queryClaudeWithDoc(post._id, post.title, "artPrompt", `${queryImageRoot}${post.contents.html}`),
    queryClaudeWithDoc(post._id, post.title, "artPrompt",     `${queryImageRoot}${post.contents.html}`)
  ]
}

async function generateSpotlightImage(prompt: string) {
  const trimmedPrompt = trimFirstParagraph(prompt)
  const combinedPrompt = "minimalist aquarelle painting by Thomas Schaller, on a white background" + trimmedPrompt
  console.log("generating image:\n\n", combinedPrompt)
  return generateImage(combinedPrompt)
}

async function createSpotlights() {
  const tag = await Tags.findOne({name: "Best of LessWrong"})
  if (tag) {
    const posts = await Posts.find(
      {[`tagRelevance.${tag._id}`]: {$gt: 0}}
    ).fetch()

    const results: Array<AIResponse> = []
    const date = new Date()
    
    for (let i = 0; i < posts.splice(0,1).length; i++) {
      const newResults = await Promise.all(createSpotlight(posts[i]))
      results.push(...newResults)
      const artPrompts = newResults.filter((result) => result.type === "artPrompt").map((result) => result.result)
      console.log(artPrompts)
      const artResult = await Promise.all(artPrompts.map(prompt => generateSpotlightImage(prompt)))
      results.push(...artResult.map((result) => ({docId: posts[i]._id, docTitle: posts[i].title, type: "art", result})))
      // setTimeout(() => {}, 1000)
    }
    const apiCompletionTime = (new Date()).getMilliseconds() - date.getMilliseconds()
    console.log(apiCompletionTime)
    
    Object.values(groupBy(results, (result) => result.docId)).forEach((results, i) => {
      console.log(results[0].docTitle)
      const summaries = results.filter((result) => result.type === "summary").map((result) => result.result)
      const artPrompts = results.filter((result) => result.type === "artPrompt").map((result) => result.result)
      const artResults = results.filter((result) => result.type === "art").map((result) => result.result)
      console.log(summaries.join("\n\n"))
      console.log(artPrompts.join("\n\n"))
      console.log(artResults.join("\n\n"))
      void Spotlights.rawInsert({
        documentId: results[0].docId,
        documentType: "Post",
        draft: true,
        duration: 1
      })
    })
  }
  return "Done"
}

Globals.createSpotlights = createSpotlights;
Globals.queryClaude = queryClaude;
