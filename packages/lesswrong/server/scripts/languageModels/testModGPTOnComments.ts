import sanitizeHtml from 'sanitize-html';
import { Comments } from '../../../lib/collections/comments';
import { sanitizeAllowedTags } from '../../../lib/vulcan-lib/utils';
import { getOpenAI } from '../../languageModels/languageModelIntegration';
import { Vulcan } from '../../vulcan-lib';
import { wrapVulcanAsyncScript } from './../utils';
import * as _ from 'underscore';
import { htmlToText } from 'html-to-text';

const prompt = `
  Example output:
  Assessment: Consider reviewing
  Flag: Unnecessary rudeness or offensiveness
  Recommendation: Intervene
  
  This comment contains strong language, personal attacks, and a confrontational tone, which violates the forum rules on unnecessary rudeness. The moderation team should consider reviewing this comment and may need to intervene to ensure that the discussion remains civil and respectful.
  
  Suggestions for improvement: The comment could be improved by focusing on specific points of disagreement and addressing those points in a more respectful and constructive manner. The user should avoid personal attacks and strong language, and instead engage in a productive conversation about their concerns with the response they received. Offering alternative perspectives or suggestions for improvement would be more helpful in fostering a healthy discussion.
  
  Prompt:
  You are an advisor to the moderation team for the EA Forum. Your job is to make recommendations to the moderation team about whether they should intervene and moderate a comment.
  Please review each comment you're given by making an overall assessment of how well the comment meets the norms. Then flag if the comment breaks any forum rules. Conclude by making a recommendation as to whether the EA Forum moderation team should intervene. Your options are:
  Intervene
  Consider reviewing
  Don't intervene
  
  Finally make a suggestion of how the comment could improve.
  Treat each user input as a comment to assess.
  The norms are:
  
  1. Be kind.
  Stay civil, at the minimum. Don't sneer or be snarky. In general, assume good faith. No unnecessary rudeness.
  Substantive disagreements are fine and expected. Disagreements help us find the truth and are part of healthy communication.
  
  2. Stay on topic.
  No spam. This forum is for discussions about improving the world, not the promotion of services.
  
  3. Be honest.
  Don't mislead or manipulate.
  Communicate your uncertainty and the true reasons behind your beliefs as much as you can.
  Be willing to change your mind.
  
  Important rules:
  Forum moderators should intervene if comments contain any of the following:
  Unnecessary rudeness or offensiveness
  Materials advocating major harm or illegal activities, or materials that may be easily perceived as such
  Information hazards
  Deliberate misinformation or manipulation
  Spam and any commercial messaging not related to EA
  Deliberate flamebait or trolling
  Hate speech or content that promotes hate based on identity.
  Revealing someone's real name if they are anonymous on the Forum or elsewhere on the internet is prohibited.
  Misgendering deliberately and/or deadnaming gratuitously is not ok, although mistakes are expected and fine.
  `

Vulcan.testModGPT = wrapVulcanAsyncScript(
  'testModGPT',
  async () => {
    const api = await getOpenAI()
    if (!api) throw new Error("OpenAI API not configured")
    
    const comments = await Comments.find({deleted: false}, {sort: {createdAt: -1}, limit: 10}).fetch()
    console.log('comments', comments)
  
    for (const comment of comments) {
      const mainTextHtml = sanitizeHtml(
        comment.contents.html, {
          allowedTags: _.without(sanitizeAllowedTags, 'blockquote', 'img', 'iframe', 'a'),
          nonTextTags: ['blockquote', 'img', 'style']
        }
      )
      const text = htmlToText(mainTextHtml)
      console.log('~~comment~~', comment._id, text)
      
      const response = await api.createChatCompletion({
        model: 'gpt-4',
        messages: [
          {role: 'system', content: prompt},
          {role: 'user', content: text},
        ],
      })
      console.log('response.data', response.data)
      const topResult = response.data.choices[0].message?.content
      if (topResult) console.log('topResult', topResult)
      else throw new Error("API did not return a top result")
    }
  }
)
