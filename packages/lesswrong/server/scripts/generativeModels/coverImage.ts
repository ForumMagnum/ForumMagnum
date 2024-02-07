/* eslint no-console: 0 import/no-deprecated:0 */

import OpenAI from 'openai';
import axios from 'axios';
import { Globals, createAdminContext, createMutator } from '../../vulcan-lib/index.ts';
import Posts from '../../../lib/collections/posts/collection.ts';
import { App } from '@slack/bolt';
import ReviewWinners from '../../../lib/collections/reviewWinners/collection.ts';
import ReviewWinnerArts from '../../../lib/collections/reviewWinnerArts/collection.ts';
import { moveImageToCloudinary } from '../convertImagesToCloudinary.ts';
import { myMidjourneyAPIKeySetting, reviewArtSlackAPIKeySetting, reviewArtSlackSigningSecretSetting } from '../../../lib/instanceSettings.ts';
import { getOpenAI } from '../../languageModels/languageModelIntegration.ts';
import { sleep } from '../../../lib/utils/asyncUtils.ts';
import shuffle from 'lodash/shuffle';
import { trace } from '../../../lib/helpers.ts';

const DEPLOY = false

let lastMidjourneyRequest = 0
let midjourneyRequests: string[] = []

let essayRights: {[essay: string]: boolean} = {}

const myMidjourneyKey = myMidjourneyAPIKeySetting.get()
if (!myMidjourneyKey) {
  throw new Error('No MyMidjourney API key found!');
}

const slackApp = new App({
  token: reviewArtSlackAPIKeySetting.get() ?? undefined,
  signingSecret: reviewArtSlackSigningSecretSetting.get() ?? undefined,
})

const promptUrls = [
  "https://s.mj.run/W91s58GkTUs",
  "https://s.mj.run/D5okH4Ak-mw",
  "https://s.mj.run/1aM-y0W73aA",
  "https://s.mj.run/JAlgYmUiOdc",
]

const acquireMidjourneyRights = async (promiseId: string): Promise<boolean> => {
  midjourneyRequests.push(promiseId)
  return new Promise(resolve => {
    const interval = setInterval(() => {
      if (midjourneyRequests[0] === promiseId && new Date().getTime() - lastMidjourneyRequest > 3_000) {
        console.log("mj rights acquired", promiseId)
        midjourneyRequests.shift()
        lastMidjourneyRequest = new Date().getTime()
        clearInterval(interval)
        resolve(true)
      }
    }, 1000)
  })
}

const acquireEssayThreadRights = async (title: string): Promise<void> => {
  if (!essayRights[title]) {
    essayRights[title] = true
    return Promise.resolve()
  }
  return new Promise((resolve) => {
    const interval = setInterval(() => {
      if (!essayRights[title]) {
        essayRights[title] = true
        clearInterval(interval)
        resolve()
      }
    }, 1000)
  })
}

const releaseMidjourneyRights = (promiseId: string) => {
  midjourneyRequests = midjourneyRequests.filter(p => p !== promiseId)
}

const releaseEssayThreadRights = (title: string) => {
  essayRights[title] = false
}

const llm_prompt = (title: string, essay: string) => `I am creating cover art for essays that will be featured on LessWrong. For each piece of art, I want a clear visual metaphor that captures the essence of the essay.

The visual metaphor should be concrete and specific, and should be something that can be depicted in a single image. The metaphor should be something that is both visually striking and that captures the essence of the essay in a way that is likely to be interesting. It should be 5 - 15 words long.

The image should not contain any text. It should not have any writing. It should not refer to the content of written materials. It should ask for symbols representing concepts, but instead ask for concrete images (it's fine if you intend them to represent something, but they should be concrete images).

If the essay contains any particular images or visual metaphors, feel free to use those in the answers.

Here are some examples:

1. a sea of thousands of people, one of them zoomed in using a magnifying glass
2. a set of scales with a heap of gold on one side and a heart on the other
3. a tree with tangled roots and a single leaf
4. a person standing on a mountain peak looking out over a vast landscape
5. images from different time periods with a wanderer walking through them

Here are some bad examples:

1. A quill writing the word 'honor'
2. A pile of resources dwindling
3. A collection of books about Zen Buddhism

Please generate 3 visual metaphors for the essay that will appear on Lesswrong. The essay will appear after the "===".

Please format your response as follows:

SUMMARY: What is the main idea of the essay?
IDEAS: A JSON list of 3 visual metaphors, like ["a sea of thousands of people, one of them zoomed in using a magnifying glass", "a set of scales with a heap of gold on one side and a heart on the other", "a tree with tangled roots and a single leaf"]
CHECK: For each metaphor, write out the metaphor and answer (a) does the metaphor contain writing or refer to the content of written materials or say that words should appear in the image? (yes/no) (b) Does the metaphor ask for any symbols respresenting concepts? (yes/no) Is it 5 to 15 words long? (yes/no)
CORRECTIONS: If any of the metaphors contain writing or refer to the content of written materials, please provide a corrected version of the metaphor.
METAPHORS: A JSON list of your final 3 visual metaphors.

===

${title}

${essay}`

const getEssays = async (): Promise<Essay[]> => {
  const postIds = await ReviewWinners.find({reviewYear: 2021}, { limit: 50, projection: { postId: 1 } }).fetch();
  const es = await Posts.find({ _id: { $in: postIds.map(p => p.postId) } }).fetch();

  return es.map(e => {
    return {post: e, title: e.title, content: e.contents.html }
  })
}

type Essay = {post: DbPost, title: string, content: string}
type PostedEssay = {post: DbPost, title: string, content: string, threadTs: string}
type MyMidjourneyResponse = {messageId: "string", uri?: string, progress: number, error?: string}

const getElements = async (openAiClient: OpenAI, essay: {title: string, content: string}): Promise<string[]> => {
  const content = essay.content.length > 25_000 ? essay.content.slice(0, 12_500) + "\n[EXCERPTED FOR LENGTH]\n" + essay.content.slice(-12_500) : essay.content
  const completion = await openAiClient.chat.completions.create({
    messages: [{role: "user", content: llm_prompt(essay.title, content)}],
    model: "gpt-4",
  }).catch((error) => {
    if (error instanceof OpenAI.APIError && error.status === 400 && error.code === 'context_length_exceeded') {
      return openAiClient.chat.completions.create({
        messages: [{role: "user", content: llm_prompt(essay.title, content.slice(0, 8_000) + "\n[EXCERPTED FOR LENGTH]\n" + essay.content.slice(-8_000))}],
        model: "gpt-4",
      })
    } else {
      throw error
    }
  })


  try {
    return JSON.parse((completion.choices[0].message.content || '').split('METAPHORS: ')[1])
  } catch (error) {
    console.error('Error parsing response:', error);
    throw error;
  }
}

const prompter = (el: string) => {
  const lowerCased = el[0].toLowerCase() + el.slice(1)
  return `${shuffle(promptUrls)[0]} topographic watercolor artwork of ${lowerCased}, in the style of ethereal watercolor washes, ultrafine detail, juxtaposition of hard and soft lines, delicate ink lines, inspired by scientific illustrations, in the style of meditative pastel moebius, muted colors --ar 8:5 --v 6.0 `
}


const postPromptImages = async (prompt: string, {title, threadTs}: {title: string, threadTs: string}, images: string[]) => {
  await acquireEssayThreadRights(title)
  await postReply(`*Prompt: ${prompt}*`, threadTs)

  await Promise.all(images.map(async (image) => {
    const response = await fetch(image)
    await slackApp.client.files.uploadV2(
      {
        thread_ts: threadTs,
        channel_id: channelId,
        initial_comment: `${prompt} for _${title}_`,
        file: Buffer.from(await response.arrayBuffer()),
        filename: `${new Date().getTime()}.png`
      }
    )
  }))
  setTimeout(() => releaseEssayThreadRights(title), 10_000)
  return images
}

const pressMidjourneyButton = async (messageId: string, button: string) => {
  await acquireMidjourneyRights(`${messageId}-${button}`)
  return fetch(`https://api.mymidjourney.ai/api/v1/midjourney/button`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${myMidjourneyKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({messageId, button})
  }).then(r => r.json())
    .then(j => j.messageId)
    .then(checkOnJob)
    .then(r => { releaseMidjourneyRights(`${messageId}-${button}`); return r })
}

const saveImage = async (el: string, essay: PostedEssay, url: string) => {
  const newUrl = await moveImageToCloudinary(url, `splashArtImagePrompt${el}`)
  if (!newUrl) {
    console.error("Failed to upload image to cloudinary", el, essay)
    return
  }
  await createMutator({
    collection: ReviewWinnerArts,
    context: createAdminContext(),
    document: {
      postId: essay.post._id, 
      splashArtImagePrompt: el,
      splashArtImageUrl: newUrl
    }
  })
  return newUrl
}

const upscaledImages = async (el: string, essay: PostedEssay, messageId: string): Promise<(string | undefined)[]> =>
  Promise.all(["U1","U2","U3","U4"]
    .map(button => pressMidjourneyButton(messageId, button)
      .then(m => m && upscaleImage(m.messageId))
      .then(trace)
      .then(uri => uri && saveImage(el, essay, uri))))

const upscaleImage = async (messageId: string): Promise<string | undefined> => {
  const res = await pressMidjourneyButton(messageId, "Upscale (Subtle)")
  return res?.uri
}

async function checkOnJob(jobId: string): Promise<MyMidjourneyResponse | undefined> {
  try {
    const response = await fetch(`https://api.mymidjourney.ai/api/v1/midjourney/message/${jobId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${myMidjourneyKey}`,
        'Content-Type': 'application/json'
      }
    })

    const responseData = await response.json()
    if (responseData.progress === 100 || responseData.error) {
      if (responseData.error) {
        console.error('Image generation failed:', responseData);
        return undefined
      }
      return responseData
    } else {
      await sleep(5_000)
      return checkOnJob(jobId)
    }
  } catch (error) {
    console.error('Error getting updates', error);
    return checkOnJob(jobId)
  }
}

async function getEssayPromptJointImageMessage(promptElement: string): Promise<MyMidjourneyResponse|undefined> {
  let promptResponseData: any;
  let jobId: string;  
  try {
    await acquireMidjourneyRights(promptElement)
    const response = await fetch('https://api.mymidjourney.ai/api/v1/midjourney/imagine', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${myMidjourneyKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({prompt: prompter(promptElement)})
    });

    promptResponseData = await response.json();
    jobId = promptResponseData.messageId
  } catch (error) {
    console.error('Error generating image:', error);
    throw error;
  }

  return checkOnJob(jobId).then(r => { releaseMidjourneyRights(promptElement); return r })
}

const slackToken = reviewArtSlackAPIKeySetting.get();
const channelId = DEPLOY ? 'C06G6QVCE6S' : 'C06G79HMK9C';

// Header configuration for the Slack API
const headers = {
  'Authorization': `Bearer ${slackToken}`,
  'Content-Type': 'application/json'
};

// Function to post a message
async function postMessage(text: string, threadTs?: string) {
  const data = {
    channel: channelId,
    text: text,
    ...(threadTs && { thread_ts: threadTs }) // Add thread_ts if provided
  };

  try {
    const response = await axios.post('https://slack.com/api/chat.postMessage', data, { headers });
    return response.data;
  } catch (error) {
    console.error('Error posting message:', error);
  }
}

// Create a thread by posting a message
async function createThread(initialText: string) {
  const response = await postMessage(initialText);
  
  if (response && response.ok) {
    return response.message.ts; // Timestamp of the message, used as thread ID
  } else {
    console.error('Failed to create thread:', response);
  }
}

const makeEssayThread = async (essay: Essay): Promise<PostedEssay> =>
  ({...essay, threadTs: await createThread(`Post title: ${essay.title}`)})

// Post a reply to the thread
async function postReply(text: string, threadTs: string) {
  await postMessage(text, threadTs);
}

async function generateCoverImages({limit = 2}: {
    limit?: number
} = {}): Promise<string[]> {
  const openAiClient = await getOpenAI()
  if (!openAiClient) {
    throw new Error('Could not initialize OpenAI client!');
  }
  const essays = (await getEssays()).slice(0, limit)

  const [imUrls] = await essays.reduce(async (prev: Promise<[Promise<string[]>, number]>, essay): Promise<[Promise<string[]>, number]> => {

    const [imUrls, charsRequested] = await prev
    let newChars = charsRequested

    if ((charsRequested + essay.content.length) >= 30_000) {
      await sleep(60_000) // Promise.all([sleep(60_000), imUrls])
      newChars = 0
    }
    newChars += Math.min(essay.content.length, 30_000)

    const images = getElements(openAiClient, essay)
      .then(async els => [els, await makeEssayThread(essay)] as [string[], PostedEssay])
      .then(([els, postedEssay]: [string[], PostedEssay]) =>
        Promise.all(els
          .slice(0,limit)
          .map(el => getEssayPromptJointImageMessage(el)
            .then(trace)
            .then(x => x === undefined ? Promise.resolve([]) : upscaledImages(el, postedEssay, x.messageId))
            .then(trace)
            .then(urls => postPromptImages(el, postedEssay, urls.filter(url => !!url) as string[])))))
      .then(ims => ims.flat())

    return [
      Promise
        .all([imUrls, images])
        .then(([elts, els]) => [...elts, ...els]),
      newChars
    ]
  }, Promise.resolve([Promise.resolve([]), 0]) as Promise<[Promise<string[]>, number]>)

  return imUrls
}

async function main () {
  await generateCoverImages({limit: 100})
}

Globals.coverImages = main
