import { getOpenAI } from './languageModelIntegration';
import { getCollectionHooks } from '../mutationCallbacks';
import { isAnyTest } from '../../lib/executionEnvironment';
import sanitizeHtml from 'sanitize-html';
import { sanitizeAllowedTags } from '../../lib/vulcan-lib/utils';
import { htmlToText } from 'html-to-text';
import { createMutator, updateMutator } from '../vulcan-lib';
import Comments from '../../lib/collections/comments/collection';
import Posts from '../../lib/collections/posts/collection';
import { EA_FORUM_COMMUNITY_TOPIC_ID } from '../../lib/collections/tags/collection';
import { dataToHTML } from '../editor/conversionUtils';
import { isEAForum } from '../../lib/instanceSettings';
import Users from '../../lib/collections/users/collection';
import { commentGetPageUrlFromIds } from '../../lib/collections/comments/helpers';
import type { OpenAIApi } from 'openai';
import Conversations from '../../lib/collections/conversations/collection';
import Messages from '../../lib/collections/messages/collection';
import { getAdminTeamAccount } from '../callbacks/commentCallbacks';
import { captureEvent } from '../../lib/analyticsEvents';
import { appendToSunshineNotes } from '../../lib/collections/users/helpers';
import { createAdminContext } from "../vulcan-lib/query";


export const modGPTPrompt = `
  Example output:
  Recommendation: Intervene
  Assessment: Does not meet the norms
  Flag: Unnecessary rudeness or offensiveness
  
  This comment contains strong language, personal attacks, and a confrontational tone, which violates the forum rules on unnecessary rudeness. The moderation team should consider reviewing this comment and may need to intervene to ensure that the discussion remains civil and respectful.
  
  Suggestions for improvement: The comment could be improved by focusing on specific points of disagreement and addressing those points in a more respectful and constructive manner. The user should avoid personal attacks and strong language, and instead engage in a productive conversation about their concerns with the response they received. Offering alternative perspectives or suggestions for improvement would be more helpful in fostering a healthy discussion.
  
  Prompt:
  You are an advisor to the moderation team for the EA Forum. Your job is to make recommendations to the moderation team about whether they should intervene and moderate a comment.
  Review each comment you're given by making an overall assessment of how well the comment meets the norms. Then flag if the comment breaks any Forum rules. Conclude by making a recommendation as to whether the moderation team should intervene. Your options are:
  Intervene
  Consider reviewing
  Don't intervene
  
  Finally make a suggestion of how the comment could be improved.
  Treat each user input as a comment to assess.
  
  The norms are:
  Be kind. Stay civil, at the minimum. Don't sneer or be snarky. In general, assume good faith. Substantive disagreements are fine and expected. Disagreements help us find the truth and are part of healthy communication.
  Be honest. Don't mislead or manipulate. Communicate your uncertainty and the true reasons behind your beliefs as much as you can. Be willing to change your mind.
  
  These are against Forum rules. Moderators should intervene if the comment contains any of the following:
  Unnecessary rudeness or offensiveness
  Advocating major harm or illegal activities, or any content that may be easily perceived as such
  Information hazards
  Deliberate misinformation or manipulation
  Spam and any commercial messaging not related to effective altruism
  Deliberate flamebait or trolling
  Hate speech or content that promotes hate based on identity
  Revealing someone's real name if they are anonymous on the Forum or elsewhere on the internet
  Misgendering deliberately and/or deadnaming gratuitously
  `

const getModGPTAnalysis = async (api: OpenAIApi, text: string) => {
  return await api.createChatCompletion({
    model: 'gpt-4',
    messages: [
      {role: 'system', content: modGPTPrompt},
      {role: 'user', content: text},
    ],
  })
}

/**
 * Constructs the PM sent to the commenter when ModGPT flags their comment as "Intervene".
 */
const getMessageToCommenter = (user: DbUser, commentLink: string, flag?: string) => {
  const normsLink = 'https://forum.effectivealtruism.org/posts/yND9aGJgobm5dEXqF/guide-to-norms-on-the-forum'
  let intro = `
    <p>Our moderation bot suspects that <a href="${commentLink}">your recent comment</a> violates the <a href="${normsLink}">EA Forum discussion norms</a>.</p>
  `
  if (flag) {
    intro = `
      <p>Our moderation bot suspects that <a href="${commentLink}">your recent comment</a> violates the following <a href="${normsLink}">EA Forum discussion norm(s)</a>:</p>
      <ul><li>${flag}</li></ul>
    `
  }
  
  return `
  <p>Hi,</p>
  ${intro}
  <p>Your comment will be collapsed by default. We encourage you to improve the comment, after which the bot will re-evaluate it.</p>
  <p>This system is new. If you believe the bot made a mistake, please report this to the EA Forum Team by replying to this message or contacting us <a href="https://forum.effectivealtruism.org/contact">here</a>. Please also reach out if you'd like any help editing your comment to better follow the Forum's norms.</p>
  `
}

/**
 * Ask GPT-4 to help moderate the given comment. It will respond with a "recommendation", as per the prompt above.
 */
async function checkModGPT(comment: DbComment): Promise<void> {
  const api = await getOpenAI();
  if (!api) {
    if (!isAnyTest) {
      //eslint-disable-next-line no-console
      console.log("Skipping ModGPT (API not configured)")
    }
    return
  }
  
  if (!comment.contents?.originalContents?.data) {
    if (!isAnyTest) {
      //eslint-disable-next-line no-console
      console.log("Skipping ModGPT (no contents on this comment!)")
    }
    return
  }

  const data = await dataToHTML(comment.contents.originalContents.data, comment.contents.originalContents.type, true)
  const html = sanitizeHtml(data, {
    allowedTags: sanitizeAllowedTags.filter(tag => !['img', 'iframe'].includes(tag)),
    nonTextTags: ['img', 'style']
  })
  const text = htmlToText(html)

  let response = await getModGPTAnalysis(api, text)
  // If the API is too busy the first time, we try one more time.
  // See https://platform.openai.com/docs/guides/error-codes/api-errors
  const analyticsData = {
    userId: comment.userId,
    commentId: comment._id
  }
  if (response.status === 429) {
    captureEvent("modGPTError", {
      ...analyticsData,
      status: response.status
    })
    response = await getModGPTAnalysis(api, text)
  }
  
  // If we can't reach ModGPT, then make sure to clear out any previous ModGPT-related data on the comment.
  if (response.status !== 200) {
    captureEvent("modGPTError", {
      ...analyticsData,
      status: response.status
    })
    await updateMutator({
      collection: Comments,
      documentId: comment._id,
      unset: {
        modGPTAnalysis: 1,
        modGPTRecommendation: 1
      },
      validate: false,
    })
    return
  }
  
  const topResult = response.data.choices[0].message?.content
  if (topResult) {
    const matches = topResult.match(/^Recommendation: (.+)/)
    const rec = (matches?.length && matches.length > 1) ? matches[1] : undefined
    await updateMutator({
      collection: Comments,
      documentId: comment._id,
      set: {
        modGPTAnalysis: topResult,
        modGPTRecommendation: rec
      },
      validate: false,
    })
    captureEvent("modGPTResponse", {
      ...analyticsData,
      comment: text,
      analysis: topResult,
      recommendation: rec
    })
    
    // if ModGPT recommends intervening, we collapse the comment and PM the comment author
    if (rec === 'Intervene') {
      const user = await Users.findOne(comment.userId)
      if (!user) throw new Error(`Could not find ${comment.userId}`)

      const commentLink = commentGetPageUrlFromIds({
        postId: comment.postId,
        commentId: comment._id,
        permalink: true,
        isAbsolute: true
      })
      const flagMatches = topResult.match(/^Flag: (.+)/m)
      const flag = (flagMatches?.length && flagMatches.length > 1) ? flagMatches[1] : undefined
      
      // create a new conversation between the commenter and the admin team account
      const adminsAccount = await getAdminTeamAccount()
      const conversationData = {
        participantIds: [user._id, adminsAccount._id],
        title: 'Your comment was auto-flagged'
      }
      const conversation = await createMutator({
        collection: Conversations,
        document: conversationData,
        currentUser: adminsAccount,
        validate: false
      })
      
      const messageDocument = {
        userId: adminsAccount._id,
        contents: {
          originalContents: {
            type: "html",
            data: getMessageToCommenter(user, commentLink, flag)
          }
        },
        conversationId: conversation.data._id,
      }
      await createMutator({
        collection: Messages,
        document: messageDocument,
        currentUser: adminsAccount,
        validate: false
      })
      
      // also add a note for mods
      const context = createAdminContext();
      await appendToSunshineNotes({
        moderatedUserId: comment.userId,
        adminName: "ModGPT",
        text: `Intervened on comment ID=${comment._id}`,
        context,
      });
    }
  }
}

getCollectionHooks("Comments").updateAsync.add(async ({oldDocument, newDocument}) => {
  if (!isEAForum || !newDocument.postId || newDocument.deleted) return
  if (!oldDocument.contents.originalContents?.data || !newDocument.contents.originalContents?.data) return
  
  const noChange = oldDocument.contents.originalContents.data === newDocument.contents.originalContents.data
  if (noChange) return
  // only have ModGPT check comments on posts tagged with "Community"
  const postTags = (await Posts.findOne(newDocument.postId))?.tagRelevance
  if (!postTags || !Object.keys(postTags).includes(EA_FORUM_COMMUNITY_TOPIC_ID)) return
  
  void checkModGPT(newDocument)
})

getCollectionHooks("Comments").createAsync.add(async ({document}) => {
  if (!isEAForum || !document.postId || document.deleted) return
  // only have ModGPT check comments on posts tagged with "Community"
  const postTags = (await Posts.findOne({_id: document.postId}))?.tagRelevance
  if (!postTags || !Object.keys(postTags).includes(EA_FORUM_COMMUNITY_TOPIC_ID)) return
  
  void checkModGPT(document)
})
