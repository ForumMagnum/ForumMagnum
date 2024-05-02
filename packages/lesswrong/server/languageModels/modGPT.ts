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
import OpenAI from 'openai';
import Conversations from '../../lib/collections/conversations/collection';
import Messages from '../../lib/collections/messages/collection';
import { getAdminTeamAccount } from '../callbacks/commentCallbacks';
import { captureEvent } from '../../lib/analyticsEvents';
import { appendToSunshineNotes } from '../../lib/collections/users/helpers';
import { createAdminContext } from "../vulcan-lib/query";
import difference from 'lodash/difference';
import { truncatise } from '../../lib/truncatise';


export const modGPTPrompt = `
  You are an advisor to the moderation team for the EA Forum. Your job is to make recommendations to the moderation team about whether they should intervene and moderate a comment.

  The three primary norms on the Forum are:
  * Be kind. Stay civil, at the minimum. Don't sneer or be snarky. In general, assume good faith. Substantive disagreements are fine and expected. Disagreements help us find the truth and are part of healthy communication.
  * Stay on topic. No spam. The Forum is for discussions about improving the world, not the promotion of services. Don't derail conversations in irrelevant directions.
  * Be honest. Don't mislead or manipulate. Communicate your uncertainty and the true reasons behind your beliefs as much as you can. Be willing to change your mind.

  The following is a list of behaviors we discourage. Moderators should intervene if the comment contains any of these:
  * Unnecessary rudeness or offensiveness
  * Advocating major harm or illegal activities
  * Information hazards
  * Deliberate misinformation or manipulation
  * Spam and any commercial messaging not related to effective altruism
  * Deliberate flamebait or trolling
  * Hate speech or content that promotes hate based on identity
  * Harassment or threats of violence
  * Misgendering deliberately and/or deadnaming gratuitously, although mistakes are expected and fine

  The user input will include some previous text as context (with the post data inside of <post> tags and the parent comment inside of <parent> tags) and the comment to be reviewed (inside <comment> tags). Review the comment you're given by making an overall assessment of how well the comment meets the norms. Make a recommendation as to whether the moderation team should intervene. Flag if the comment contains any specific discouraged behaviors from the list above.

  Your three recommendation options are:
  * Intervene
  * Consider reviewing
  * Don't intervene

  Please be generous to commenters and give them the benefit of the doubt, especially around topics related to harm or illegal actions. Remember to keep the context in mind, and do not select "Intervene" if the commenter is not the originator of the discouraged behavior. Only select "Intervene" if you are sure that the comment should be removed. If you are unsure, err on the side of selecting "Consider reviewing".  Explain your decision in 3 sentences or less.

  Finally, make a suggestion of how the comment could be improved.

  Here is an example response:
  <example>
  Recommendation: Intervene
  Flag: Unnecessary rudeness or offensiveness

  This comment contains strong language, personal attacks, and a confrontational tone, which violates the forum rules on unnecessary rudeness. The moderation team should consider reviewing this comment and may need to intervene to ensure that the discussion remains civil and respectful.

  Suggestions for improvement: The comment could be improved by focusing on specific points of disagreement and addressing those points in a more respectful and constructive manner. The user should avoid personal attacks and strong language, and instead engage in a productive conversation about their concerns with the response they received.
  </example>
  `

const getModGPTAnalysis = async (api: OpenAI, text: string) => {
  return await api.chat.completions.create({
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
async function checkModGPT(comment: DbComment, post: DbPost): Promise<void> {
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

  const commentText = sanitizeHtml(comment.contents?.html ?? "", {
    allowedTags: difference(sanitizeAllowedTags, ['img', 'iframe', 'audio']),
    nonTextTags: [ 'style', 'script', 'textarea', 'option', 'img' ]
  })
  const postText = sanitizeHtml(post.contents?.html ?? "", {
    allowedTags: difference(sanitizeAllowedTags, ['img', 'iframe', 'audio']),
    nonTextTags: [ 'style', 'script', 'textarea', 'option', 'img' ]
  })
  const postExcerpt = truncatise(postText, {TruncateBy: 'characters', TruncateLength: 300, Strict: true, Suffix: ''})
  
  // Build the message that will be attributed to the user
  let userText = `
    <post>
    Title: ${post.title}
    Excerpt: ${postExcerpt}
    </post>
  `
  if (comment.parentCommentId) {
    // If this comment has a parent, include that as well
    const parentComment = await Comments.findOne({_id: comment.parentCommentId})
    if (parentComment) {
      const parentCommentText = sanitizeHtml(parentComment.contents?.html ?? "", {
        allowedTags: difference(sanitizeAllowedTags, ['img', 'iframe', 'audio']),
        nonTextTags: [ 'style', 'script', 'textarea', 'option', 'img' ]
      })
      userText += `<parent>${parentCommentText}</parent>`
    }
  }

  userText += `<comment>${commentText}</comment>`
  
  const analyticsData = {
    userId: comment.userId,
    commentId: comment._id
  }

  try {
    let response = await getModGPTAnalysis(api, userText)
    const topResult = response.choices[0].message?.content
    if (!topResult) return
    
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
      comment: commentText,
      fullMessage: userText,
      analysis: topResult,
      recommendation: rec
    })
    
    // if ModGPT recommends intervening, we collapse the comment and PM the comment author
    // 2024-01-18: We've temporarily disabled the user-facing components of ModGPT
    // while we attempt reduce its false positive rate
    // if (rec === 'Intervene') {
    //   const user = await Users.findOne(comment.userId)
    //   if (!user) throw new Error(`Could not find ${comment.userId}`)

    //   const commentLink = commentGetPageUrlFromIds({
    //     postId: comment.postId,
    //     commentId: comment._id,
    //     permalink: true,
    //     isAbsolute: true
    //   })
    //   const flagMatches = topResult.match(/^Flag: (.+)/m)
    //   const flag = (flagMatches?.length && flagMatches.length > 1) ? flagMatches[1] : undefined
      
    //   // create a new conversation between the commenter and the admin team account
    //   const adminsAccount = await getAdminTeamAccount()
    //   if (!adminsAccount) throw new Error("Could not find admin account")
    //   const conversationData = {
    //     participantIds: [user._id, adminsAccount._id],
    //     title: 'Your comment was auto-flagged'
    //   }
    //   const conversation = await createMutator({
    //     collection: Conversations,
    //     document: conversationData,
    //     currentUser: adminsAccount,
    //     validate: false
    //   })
      
    //   const messageDocument = {
    //     userId: adminsAccount._id,
    //     contents: {
    //       originalContents: {
    //         type: "html",
    //         data: getMessageToCommenter(user, commentLink, flag)
    //       }
    //     },
    //     conversationId: conversation.data._id,
    //   }
    //   await createMutator({
    //     collection: Messages,
    //     document: messageDocument,
    //     currentUser: adminsAccount,
    //     validate: false
    //   })
      
    //   // also add a note for mods
    //   const context = createAdminContext();
    //   await appendToSunshineNotes({
    //     moderatedUserId: comment.userId,
    //     adminName: "ModGPT",
    //     text: `Intervened on comment ID=${comment._id}`,
    //     context,
    //   });
    // }
    
  } catch (error) {
    if (error instanceof OpenAI.APIError) {
      captureEvent("modGPTError", {
        ...analyticsData,
        status: error.status,
        error: error.message
      })
      // If we can't reach ModGPT, then make sure to clear out any previous ModGPT-related data on the comment.
      await updateMutator({
        collection: Comments,
        documentId: comment._id,
        unset: {
          modGPTAnalysis: 1,
          modGPTRecommendation: 1
        },
        validate: false,
      })
    } else {
      //eslint-disable-next-line no-console
      console.error(error)
    }
    return
  }
}

getCollectionHooks("Comments").updateAsync.add(async ({oldDocument, newDocument}) => {
  // on the EA Forum, ModGPT checks earnest comments on posts for norm violations
  if (
    !isEAForum ||
    !newDocument.postId ||
    newDocument.deleted ||
    newDocument.spam ||
    newDocument.retracted ||
    newDocument.shortform ||
    !oldDocument.contents?.originalContents?.data ||
    !newDocument.contents?.originalContents?.data
  ) {
    return
  }
  
  const noChange = oldDocument.contents?.originalContents.data === newDocument.contents?.originalContents.data
  if (noChange) return

  // only have ModGPT check comments on posts tagged with "Community"
  const post = await Posts.findOne(newDocument.postId)
  if (!post) return
  
  const postTags = post.tagRelevance
  if (!postTags || !Object.keys(postTags).includes(EA_FORUM_COMMUNITY_TOPIC_ID)) return
  
  void checkModGPT(newDocument, post)
})

getCollectionHooks("Comments").createAsync.add(async ({document}) => {
  // on the EA Forum, ModGPT checks earnest comments on posts for norm violations
  if (
    !isEAForum ||
    !document.postId ||
    document.deleted ||
    document.spam ||
    document.retracted ||
    document.shortform
  ) {
    return
  }
  
  // only have ModGPT check comments on posts tagged with "Community"
  const post = await Posts.findOne(document.postId)
  if (!post) return
  
  const postTags = post.tagRelevance
  if (!postTags || !Object.keys(postTags).includes(EA_FORUM_COMMUNITY_TOPIC_ID)) return
  
  void checkModGPT(document, post)
})
