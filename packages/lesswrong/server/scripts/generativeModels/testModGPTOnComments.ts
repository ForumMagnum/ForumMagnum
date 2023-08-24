/* eslint-disable no-console */
import sanitizeHtml from 'sanitize-html';
import { Comments } from '../../../lib/collections/comments';
import { sanitizeAllowedTags } from '../../../lib/vulcan-lib/utils';
import { getOpenAI } from '../../languageModels/languageModelIntegration';
import { Vulcan } from '../../vulcan-lib';
import { wrapVulcanAsyncScript } from '../utils';
import * as _ from 'underscore';
import { htmlToText } from 'html-to-text';
import { modGPTPrompt } from '../../languageModels/modGPT';

/**
 * This was written for the EA Forum to test out having GPT-4 help moderate comments.
 */
Vulcan.testModGPT = wrapVulcanAsyncScript(
  'testModGPT',
  async () => {
    const api = await getOpenAI()
    if (!api) throw new Error("OpenAI API not configured")
    
    const comments = await Comments.find({deleted: false}, {sort: {createdAt: -1}, limit: 3}).fetch()
  
    for (const comment of comments) {
      const mainTextHtml = sanitizeHtml(
        comment.contents.html, {
          allowedTags: sanitizeAllowedTags.filter(tag => !['img', 'iframe'].includes(tag)),
          nonTextTags: ['img', 'style']
        }
      )
      const text = htmlToText(mainTextHtml)
      console.log('============ check comment', comment._id)
      console.log(text)
      
      const response = await api.createChatCompletion({
        model: 'gpt-4',
        messages: [
          {role: 'system', content: modGPTPrompt},
          {role: 'user', content: text},
        ],
      })
      
      const topResult = response.data.choices[0].message?.content
      if (topResult) {
        console.log('----- ModGPT response:')
        console.log(topResult)
      }
      else throw new Error("API did not return a top result")
    }
  }
)
