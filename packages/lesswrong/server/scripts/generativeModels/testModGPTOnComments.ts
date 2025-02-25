/* eslint-disable no-console */
import sanitizeHtml from 'sanitize-html';
import { Comments } from '../../../lib/collections/comments/collection';
import { getOpenAI } from '../../languageModels/languageModelIntegration';
import { wrapVulcanAsyncScript } from '../utils';
import * as _ from 'underscore';
import { modGPTPrompt, sanitizeHtmlOptions } from '../../languageModels/modGPT';
import { truncatise } from '../../../lib/truncatise';
import { fetchFragmentSingle } from '../../fetchFragment';

/**
 * This was written for the EA Forum to test out having GPT-4o help moderate comments.
 * Exported to allow running manually with "yarn repl"
 */
export const testModGPT = wrapVulcanAsyncScript(
  'testModGPT',
  async () => {
    const api = await getOpenAI()
    if (!api) throw new Error("OpenAI API not configured")
    
    const comments = await Comments.find({
      postId: {$exists: true},
      deleted: false
    }, {
      sort: {createdAt: -1},
      limit: 1,
    }).fetch()
  
    for (const comment of comments) {
      const post = await fetchFragmentSingle({
        collectionName: "Posts",
        fragmentName: "PostsPage",
        selector: {_id: comment.postId},
        currentUser: null,
        skipFiltering: true,
      });
      if (!post) continue
      
      const commentText = sanitizeHtml(comment.contents?.html ?? "", sanitizeHtmlOptions)
      const postText = sanitizeHtml(post.contents?.html ?? "", sanitizeHtmlOptions)
      const postExcerpt = truncatise(postText, {TruncateBy: 'characters', TruncateLength: 300, Strict: true, Suffix: ''})
      
      // Build the message that will be attributed to the user
      let userText = `<post>
        Title: ${post.title}
        Excerpt: ${postExcerpt}
        </post>`
      if (comment.parentCommentId) {
        // If this comment has a parent, include that as well
        const parentComment = await Comments.findOne({_id: comment.parentCommentId})
        if (parentComment) {
          const parentCommentText = sanitizeHtml(parentComment.contents?.html ?? "", sanitizeHtmlOptions)
          userText += `<parent>${parentCommentText}</parent>`
        }
      }
    
      userText += `<comment>${commentText}</comment>`
      
      console.log('============ check comment', comment._id)
      console.log(userText)
      
      const response = await api.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {role: 'system', content: modGPTPrompt},
          {role: 'user', content: userText},
        ],
      })
      
      const topResult = response.choices[0].message?.content
      if (topResult) {
        console.log('----- ModGPT response:')
        console.log(topResult)
      }
      else throw new Error("API did not return a top result")
    }
  }
)
