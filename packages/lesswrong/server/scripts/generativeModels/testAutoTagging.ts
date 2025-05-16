/* eslint-disable no-console */
import sanitizeHtml from 'sanitize-html';
import { Comments } from '../../../server/collections/comments/collection';
import { getOpenAI } from '../../languageModels/languageModelIntegration';
import { wrapVulcanAsyncScript } from '../utils';
import * as _ from 'underscore';
import { modGPTPrompt, sanitizeHtmlOptions } from '../../languageModels/modGPT';
import { truncatise } from '../../../lib/truncatise';
import { fetchFragment, fetchFragmentSingle } from '../../fetchFragment';
import { Posts } from '@/server/collections/posts/collection';

const baseMessage = `This is a post on the Effective Altruism Forum. We have a Community tag which we apply to posts which are about the EA community's dynamics, recent events, people, or gossip related to its members. It's also used as a bit of a precautionary flag for posts that might cause drama, as Community posts end up in a different section, so err on the side of applying to things that are accusatory towards people in the community. Some specific types of posts that you might think fit this description, but generally shouldn't have the tag applied: Job adverts/call for applications to EA events or opportunities, Announcements from respectable people/orgs. I want to use you to automatically tag posts as Community, this will then be reviewed by moderators. Should this post have the Community tag applied? Give your reasoning, referring to the criteria given here. Then end your response with "yes" or "no" (one word, no quotes) indicating your overall judgement on whether the post should have the tag applied.
`

/**
 * This was written for the EA Forum to test out having GPT-4o help moderate comments.
 * Exported to allow running manually with "yarn repl"
 */
export const testAutoTagging = wrapVulcanAsyncScript(
  'testAutoTagging',
  async () => {
    console.log('testAutoTagging')
    const api = await getOpenAI()
    if (!api) throw new Error("OpenAI API not configured")
    
    const posts = await fetchFragment({
      collectionName: 'Posts',
      fragmentName: 'PostsPage',
      currentUser: null,
      selector: {_id: {$in: ['r8XoHhKKzmQgxm2Lf', '53Gc35vDLK2u5nBxP', 'e95HCwqNp7RiF94ad', 'ZKfFoo8ttD9NEpKHv']}},
    })
    
    console.log('posts num', posts.length)

    for (const post of posts) {
      const postText = sanitizeHtml(post.contents?.html ?? "", sanitizeHtmlOptions)
      const postTitle = sanitizeHtml(post.title ?? "", sanitizeHtmlOptions)
      
      const debugMsg = `
      Post ID: ${post._id}
      Post Title: ${postTitle}
      Post Body: ${truncatise(postText, {TruncateBy: 'words', TruncateLength: 10, Strict: true, Suffix: '...'})}
      `
      // Build the message that will be attributed to the user
      let postMessage = baseMessage + `<post>
          Title: ${postTitle}
          Body: ${postText}
        </post>`
    
      console.log('============ check post', post.slug)
      console.log(debugMsg)
      
      const response = await api.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          // {role: 'system', content: ''},
          {role: 'user', content: postMessage},
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
