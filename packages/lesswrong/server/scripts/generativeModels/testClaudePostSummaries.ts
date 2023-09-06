/* eslint-disable no-console */
import sanitizeHtml from 'sanitize-html';
import { sanitizeAllowedTags } from '../../../lib/vulcan-lib/utils';
import { getAnthropic, languageModelGenerateText } from '../../languageModels/languageModelIntegration';
import { Vulcan } from '../../vulcan-lib';
import { wrapVulcanAsyncScript } from '../utils';
import { htmlToText } from 'html-to-text';
import Posts from '../../../lib/collections/posts/collection';

/**
 * This was written for the EA Forum to test out having Claude summarize posts.
 */
Vulcan.testClaudePostSummaries = wrapVulcanAsyncScript(
  'testClaudePostSummaries',
  async () => {
    const api = await getAnthropic()
    if (!api) throw new Error("Anthropic API not configured")
    
    const posts = await Posts.find({
      postedAt: {$ne: null},
      isEvent: false,
      authorIsUnreviewed: false,
      draft: false,
      deletedDraft: false,
    }, {sort: {postedAt: -1}, limit: 1, skip: 20}).fetch()
  
    for (const post of posts) {
      const mainTextHtml = sanitizeHtml(
        post.contents.html, {
          allowedTags: sanitizeAllowedTags.filter(tag => !['img', 'iframe'].includes(tag)),
          nonTextTags: ['img', 'style']
        }
      )
      const text = htmlToText(mainTextHtml)
      console.log('============ check post', post._id)
      console.log(text)
      
      const response = await languageModelGenerateText({
        taskName: "summarize",
        inputs: {
          title: post.title,
          text,
        },
        maxTokens: 2040
      })
      
      console.log(response)
    }
  }
)
