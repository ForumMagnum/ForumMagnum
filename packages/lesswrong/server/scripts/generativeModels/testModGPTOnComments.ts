/* eslint-disable no-console */
import sanitizeHtml from 'sanitize-html';
import { Comments } from '../../../lib/collections/comments';
import { sanitizeAllowedTags } from '../../../lib/vulcan-lib/utils';
import { getOpenAI } from '../../languageModels/languageModelIntegration';
import { Vulcan } from '../../vulcan-lib';
import { wrapVulcanAsyncScript } from '../utils';
import * as _ from 'underscore';
import { modGPTPrompt } from '../../languageModels/modGPT';
import difference from 'lodash/difference';
import { truncatise } from '../../../lib/truncatise';
import { fetchFragmentSingle } from '../../fetchFragment';

/**
 * This was written for the EA Forum to test out having GPT-4 help moderate comments.
 */
Vulcan.testModGPT = wrapVulcanAsyncScript(
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
      
      console.log('============ check comment', comment._id)
      console.log(userText)
      
      const response = await api.chat.completions.create({
        model: 'gpt-4',
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
