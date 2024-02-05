/* eslint no-console: 0 */

import OpenAI from 'openai';
import axios from 'axios';
import { Globals, createAdminContext, createMutator } from '../../vulcan-lib/index.ts';
import Posts from '../../../lib/collections/posts/collection.ts';
import { App } from '@slack/bolt';
import ReviewWinners from '../../../lib/collections/reviewWinners/collection.ts';
import ReviewWinnerArts from '../../../lib/collections/reviewWinnerArts/collection.ts';
import { moveImageToCloudinary } from '../convertImagesToCloudinary.ts';
import { imagineAPIKeySetting, reviewArtSlackAPIKeySetting, reviewArtSlackSigningSecretSetting } from '../../../lib/instanceSettings.ts';
import { getOpenAI } from '../../languageModels/languageModelIntegration.ts';

const DEPLOY = false

const maxSimultaneousMidjourney = 6
let currentMidjourney = 0

let essayRights: {[essay: string]: boolean} = {}

const slackApp = new App({
  token: reviewArtSlackAPIKeySetting.get() ?? undefined,
  signingSecret: reviewArtSlackSigningSecretSetting.get() ?? undefined,
})

const acquireMidjourneyRights = async (): Promise<boolean> => {
  if (currentMidjourney < maxSimultaneousMidjourney) {
    currentMidjourney++
    return Promise.resolve(true)
  } else {
    return new Promise((resolve) => {
      const interval = setInterval(() => {
        if (currentMidjourney < maxSimultaneousMidjourney) {
          currentMidjourney++
          clearInterval(interval)
          resolve(true)
        }
      }, 1000)
    })
  }
}

const acquireEssayThreadRights = async (title: string): Promise<void> => {
  console.log(essayRights, title)
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

const releaseMidjourneyRights = () => {
  currentMidjourney--
}

const releaseEssayThreadRights = (title: string) => {
  console.log(essayRights, title)
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

  const postIds = await ReviewWinners.find({}, { limit: 10, projection: { postId: 1 } }).fetch();
  const es = await Posts.find({ _id: { $in: postIds.map(p => p.postId) } }).fetch();

  console.log(es.map(e => e.title))

  return es.map(e => {
    return {post: e, title: e.title, content: e.contents.html }
  })
}

type Essay = {post: DbPost, title: string, content: string, threadTs?: string}

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
    // console.log('Response:', completion.choices[0].message.content)
    return JSON.parse((completion.choices[0].message.content || '').split('METAPHORS: ')[1])
  } catch (error) {
    console.error('Error parsing response:', error);
    throw error;
  }
}

const prompter = (el: string) => {
  const lowerCased = el[0].toLowerCase() + el.slice(1)
  // return `https://s.mj.run/JAlgYmUiOdc https://s.mj.run/XJyNfI1tx9o topographic watercolor artwork of ${lowerCased}, in the style of ethereal watercolor washes, ultrafine detail, juxtaposition of hard and soft lines, delicate ink lines, inspired by scientific illustrations, in the style of meditative pastel muted colors, muted meditative --ar 8:5 --v 6.0`
  return `https://s.mj.run/JAlgYmUiOdc topographic watercolor artwork of ${lowerCased}, in the style of ethereal watercolor washes, ultrafine detail, juxtaposition of hard and soft lines, delicate ink lines, inspired by scientific illustrations, in the style of meditative pastel moebius, muted colors --ar 8:5 --v 6.0 `
  // return `https://s.mj.run/JAlgYmUiOdc topographic watercolor artwork of ${lowerCased}, in the style of ethereal watercolor washes, ultrafine detail, juxtaposition of hard and soft lines, delicate ink lines, inspired by scientific illustrations, pastel colorful moebius, pastel --ar 8:5 --seed 12345 --v 6.0 --s 75`
}


const postPromptImages = async (prompt: string, {title, threadTs}: {title: string, threadTs?: string}, images: string[]) => {
  console.log('yo', prompt, title, threadTs)
  if (!threadTs) return
  await acquireEssayThreadRights(title)
  await postReply(`*Prompt: ${prompt}*`, threadTs)

  await Promise.all(images.map(async (image) => {
    console.log('upload image')
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
  console.log('all uploaded')
  setTimeout(() => releaseEssayThreadRights(title), 10_000)
}

const saveImages = async (el: string, essay: Essay, urls: string[]) => {
  await postPromptImages(el, essay, urls)
  for (let i = 0; i < urls.length; i++) {
    await moveImageToCloudinary(urls[i], `splashArtImagePrompt${el}{i}`)
    await createMutator({
      collection: ReviewWinnerArts,
      context: createAdminContext(),
      document: {
        postId: essay.post._id, 
        splashArtImagePrompt: el,
        splashArtImageUrl: urls[i]
      }
    })
  }
  return urls
}


async function go(essays: Essay[], essayIx: number, el: string): Promise<string[]> {
  const imagineKey = imagineAPIKeySetting.get();
  if (!imagineKey) {
    throw new Error('No imagine API key found!');
  }
  let promptResponseData: any;
  try {
    await acquireMidjourneyRights()
    const response = await fetch('https://cl.imagineapi.dev/items/images/', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${imagineKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({prompt: prompter(el)})
    });

    promptResponseData = await response.json();
  } catch (error) {
    console.error('Error generating image:', error);
    throw error;
  }

  const blockTilDone: Promise<string[]> = new Promise((resolve) => {
    async function checkOnJob (): Promise<string[]> {
      try {
        const response = await fetch(`https://cl.imagineapi.dev/items/images/${promptResponseData.data.id}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${imagineKey}`,
            'Content-Type': 'application/json'
          }
        })
  
        const responseData = await response.json()
        if (responseData.data.status === 'completed' || responseData.data.status === 'failed') {
          console.log(responseData.data.status, el, essayIx, essays[essayIx].title)
          if (responseData.data.status === 'failed') {
            console.error('Image generation failed:', responseData.data);
            resolve([])
            return []
          }
          releaseMidjourneyRights()
          return responseData.data.upscaled_urls
        } else {
          await new Promise((resolve) => setTimeout(resolve, 5_000))
          return await checkOnJob()
          // console.log("Image is not finished generation. Status: ", responseData.data.status)
        }
      } catch (error) {
        console.error('Error getting updates', error);
        return await checkOnJob()
      }
    }

    void checkOnJob().then(urls => saveImages(el, essays[essayIx], urls)).then(resolve)
  })

  return await blockTilDone
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

async function makeEssayThread(essay: {title: string, content: string, threadTs?: string}) {
  essay.threadTs = await createThread(`Post title: ${essay.title}`);
}

// Post a reply to the thread
async function postReply(text: string, threadTs: string) {
  await postMessage(text, threadTs);
}

async function main () {
  const openAiClient = await getOpenAI();
  if (!openAiClient) {
    throw new Error('Could not initialize OpenAI client!');
  }
  const limit = 2
  const essays = (await getEssays()).slice(0, limit)

  const [promElementss] = await essays.reduce(async (pEC: Promise<[Promise<string[]>, number]>, essay, i): Promise<[Promise<string[]>, number]> => {
    const [eltss, charsRequested] = await pEC
    let newChars = charsRequested
    if ((charsRequested + essay.content.length) >= 30_000) {
      await Promise.all([new Promise((resolve) => setTimeout(resolve, 60_000)), eltss])
      newChars = 0
    }
    newChars += Math.min(essay.content.length, 30_000)

    const images = getElements(openAiClient, essay).then(els => Promise.all([makeEssayThread(essay), Promise.all(els.slice(0,limit).map(el => go(essays, i, el))).then(ims => ims.flat())]))

    return Promise.resolve([Promise.all([eltss, images]).then(([elts, [_, el]]) => [...elts, ...el]), newChars])
  }, Promise.resolve([Promise.resolve([]), 0]) as Promise<[Promise<string[]>, number]>)

  const imUrls = await promElementss
  await slackApp.client.chat.postMessage({
    channel: channelId,
    text: JSON.stringify(imUrls)
  })

}

Globals.coverImages = () => main()
