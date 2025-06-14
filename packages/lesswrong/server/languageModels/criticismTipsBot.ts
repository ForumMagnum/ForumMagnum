import { getOpenAI } from './languageModelIntegration';
import { isAnyTest, isProduction } from '../../lib/executionEnvironment';
import sanitizeHtml from 'sanitize-html';
import { isEAForum } from '../../lib/instanceSettings';
import OpenAI from 'openai';
import { serverCaptureEvent as captureEvent } from '@/server/analytics/serverAnalyticsWriter';
import type { PostIsCriticismRequest } from '../resolvers/postResolvers';
import { sanitizeHtmlOptions } from './modGPT';


const criticismTipsBotPrompt = `
  You are an assistant for the Effective Altruism Forum.
  Decide if the given post should be tagged as "Criticism of work in effective altruism". This tag applies to posts critically examining the work, projects, or methodologies of specific individuals, organizations, or initiatives affiliated with the effective altruism (EA) movement or community.
  Give your reasoning, referring to the above criteria. Then end your response with "yes" or "no" (one word, no quotes) indicating your overall judgement on whether the post should be tagged.
`

const checkIsCriticism = async (api: OpenAI, text: string) => {
  return await api.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {role: 'system', content: criticismTipsBotPrompt},
      {role: 'user', content: text},
    ],
  })
}

/**
 * On the EA Forum, we're using an LLM to check if the post could be classified
 * as "criticism of work in effective altruism". We check while the editor is open,
 * because if this returns true, then we want to show the author a little card
 * with tips on how to make it more likely to go well (see PostsEditBotTips).
 */
export async function postIsCriticism(post: PostIsCriticismRequest, currentUserId?: string): Promise<boolean> {
  // Only run this on the EA Forum on production, since it costs money.
  if (!isEAForum || !isProduction) return false
  
  if (!post.body) {
    if (!isAnyTest) {
      //eslint-disable-next-line no-console
      console.log("Skipping criticism tips bot (no contents in this post)")
    }
    return false
  }

  const api = await getOpenAI();
  if (!api) {
    if (!isAnyTest) {
      //eslint-disable-next-line no-console
      console.log("Skipping criticism tips bot (API not configured)")
    }
    return false
  }
  
  const postBody = post.contentType === 'markdown' ? post.body : sanitizeHtml(post.body, sanitizeHtmlOptions)
  const userText = `${post.title}\n\n${postBody}`
  
  const analyticsData = {
    userId: currentUserId,
    postId: post._id,
    postTitle: post.title,
    postBody,
    fullMessage: userText,
  }

  try {
    const response = await checkIsCriticism(api, userText)
    const topResult = response.choices[0].message?.content
    if (!topResult) return false
    
    // We ask it to explain the decision, but the frontend only cares about the final decision
    const finalWord = topResult.trim().toLowerCase().split(/[\n\s]+/).pop()
    
    captureEvent("criticismTipsBotResponse", {
      ...analyticsData,
      analysis: topResult,
      decision: finalWord
    })
    return finalWord === "yes"
    
  } catch (error) {
    if (error instanceof OpenAI.APIError) {
      captureEvent("criticismTipsBotError", {
        ...analyticsData,
        status: error.status,
        error: error.message
      })
    } else {
      //eslint-disable-next-line no-console
      console.error(error)
    }
    return false
  }
}

