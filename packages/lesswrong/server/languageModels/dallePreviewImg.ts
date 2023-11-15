import { getOpenAI } from './languageModelIntegration';
import { isAnyTest } from '../../lib/executionEnvironment';
import sanitizeHtml from 'sanitize-html';
import { sanitizeAllowedTags } from '../../lib/vulcan-lib/utils';
import { htmlToText } from 'html-to-text';
import { dataToHTML } from '../editor/conversionUtils';
import OpenAI from 'openai';
import { captureEvent } from '../../lib/analyticsEvents';
import { updateMutator } from '../vulcan-lib/mutators';
import Posts from '../../lib/collections/posts/collection';
import cloudinary from 'cloudinary';
import { cloudinaryCloudNameSetting } from '../../lib/publicSettings';
import { cloudinaryApiKey, cloudinaryApiSecret } from '../scripts/convertImagesToCloudinary';
import type { GeneratePreviewImgRequest } from '../resolvers/postResolvers';


const gpt4System = `
  You are a proficient AI with a specialty in understanding and distilling posts.
  Return a prompt to be fed to DALLE 3 to generate a cover image for the given post.
  The cover image should be beautiful and clear in various sizes, including on small phone screens.
  It should have no text.
  Some keywords to use: "Wide angle, editorial illustration, traditional techniques reimagined, geometric, textured, simple, abstract, no text".
  Return only the prompt and no other text.
`

const getDallePrompt = async (api: OpenAI, text: string) => {
  return await api.chat.completions.create({
    model: 'gpt-4-1106-preview',
    messages: [
      {role: 'system', content: gpt4System},
      {role: 'user', content: text},
    ],
  })
}

const getPreviewImg = async (api: OpenAI, text: string) => {
  return await api.images.generate({
    model: 'dall-e-3',
    prompt: text,
    size: '1792x1024',
    quality: 'standard',
    n: 1
  })
}

const uploadImgToCloudinary = async (imgUrl: string) => {
  const cloudName = cloudinaryCloudNameSetting.get();
  const apiKey = cloudinaryApiKey.get();
  const apiSecret = cloudinaryApiSecret.get();
  
  if (!cloudName || !apiKey || !apiSecret) {
    // eslint-disable-next-line no-console
    console.error("Cannot upload DALLE-generated preview image to Cloudinary: not configured");
    return null
  }
  
  const result = await cloudinary.v2.uploader.upload(
    imgUrl,
    {
      folder: `SocialPreview`,
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
    }
  );
  
  return result.public_id
}

/**
 * Use GPT-4 and DALLE 3 to generate a preview image for the given post data.
 * "userId" is only used for analytics purposes.
 */
export async function generateDallePreviewImg(post: GeneratePreviewImgRequest, userId?: string): Promise<string|null> {
  const api = await getOpenAI();
  if (!api) {
    if (!isAnyTest) {
      //eslint-disable-next-line no-console
      console.log("Skipping DALLE (API not configured)")
    }
    return null
  }
  console.log('post', post)
  const data = await dataToHTML(post.body, post.contentType, true)
  const html = sanitizeHtml(data, {
    allowedTags: sanitizeAllowedTags.filter(tag => !['img', 'iframe'].includes(tag)),
    nonTextTags: ['img', 'style']
  })
  const text = htmlToText(html)
  console.log('============ check post', post._id)
  console.log(text)
  
  const analyticsData = {
    userId,
    postId: post?._id
  }

  try {
    const dallePrompt = await getDallePrompt(api, text)
    const topResult = dallePrompt.choices[0].message?.content
    console.log('topResult', topResult)
    if (!topResult) return null
    
    const response = await getPreviewImg(api, topResult)
    const imgUrl = response.data[0].url
    console.log('response', response)
    console.log('url', imgUrl)
    if (!imgUrl) return null
    
    return await uploadImgToCloudinary(imgUrl)
    
    // await updateMutator({
    //   collection: Posts,
    //   documentId: post._id,
    //   set: {
    //     socialPreview: {...post.socialPreview, imageId: cloudinaryId}
    //   },
    //   validate: false,
    // })
    
  } catch (error) {
    if (error instanceof OpenAI.APIError) {
      captureEvent("dallePreviewImgError", {
        ...analyticsData,
        status: error.status,
        error: error.message
      })
    } else {
      //eslint-disable-next-line no-console
      console.error(error)
    }
    return null
  }
}

