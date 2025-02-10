import OpenAI from 'openai';
import { Globals, createAdminContext, createMutator } from '../../vulcan-lib/index.ts';
import ReviewWinners from '../../../lib/collections/reviewWinners/collection.ts';
import ReviewWinnerArts from '../../../lib/collections/reviewWinnerArts/collection.ts';
import { moveImageToCloudinary } from '../convertImagesToCloudinary.ts';
import { myMidjourneyAPIKeySetting } from '../../../lib/instanceSettings.ts';
import { getOpenAI } from '../../languageModels/languageModelIntegration.ts';
import { sleep } from '../../../lib/utils/asyncUtils.ts';
import shuffle from 'lodash/shuffle';
import { filterNonnull } from '../../../lib/utils/typeGuardUtils.ts';
import { fetchFragment } from '../../fetchFragment.ts';

const myMidjourneyKey = myMidjourneyAPIKeySetting.get()

const promptUrls = [
  "https://s.mj.run/W91s58GkTUs",
  "https://s.mj.run/D5okH4Ak-mw",
  "https://s.mj.run/1aM-y0W73aA",
  "https://s.mj.run/JAlgYmUiOdc",
]

const llm_prompt = (title: string, essay: string) => `I am creating cover art for essays that will be featured on LessWrong. For each piece of art, I want a clear visual metaphor that captures the essence of the essay.

The visual metaphor should be concrete and specific, and should be something that can be depicted in a single image. The metaphor should be something that is both visually striking and that captures the essence of the essay in a way that is likely to be interesting. It should be 5 - 15 words long.

The image should not contain any text. It should not have any writing. It should not refer to the content of written materials. It should not ask for symbols representing concepts, but instead ask for concrete images (it's fine if you intend them to represent something, but they should be concrete images).

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

const getEssaysWithoutEnoughArt = async (): Promise<Essay[]> => {
  const postIds = await ReviewWinners
    .find({}, { projection: { postId: 1 }, sort: { reviewRanking: 1 } })
    .fetch();
  const reviewArts = await ReviewWinnerArts
    .find({})
    .fetch();
  const postIdsWithoutLotsOfArt = postIds
  .filter(p => reviewArts.filter(a => a.postId === p.postId).length < 9)
  const postIdsWithoutEnoughArt = postIds
  .filter(p => reviewArts.filter(a => a.postId === p.postId).length < 10)

  const postsToFind = postIdsWithoutLotsOfArt.length > 0 ? postIdsWithoutLotsOfArt : postIdsWithoutEnoughArt

  const essays = await fetchFragment({
    collectionName: "Posts",
    fragmentName: "PostsPage",
    selector: {_id: {$in: postsToFind.map(p => p.postId)}},
    currentUser: null,
    skipFiltering: true,
  });

  const toGenerate = (p: PostsPage) => Math.ceil((12 - reviewArts.filter(art => art.postId === p._id).length)/4)

  return essays.map(e => {
    return {post: e, title: e.title, content: e.contents?.html ?? "", toGenerate: toGenerate(e) }
  })
}

type Essay = {post: PostsPage, title: string, content: string, toGenerate: number}
type MyMidjourneyResponse = {messageId: "string", uri?: string, progress: number, error?: string}

const getPromptTextElements = async (openAiClient: OpenAI, essay: {title: string, content: string}, tryCount = 0): Promise<string[]> => {
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
      // eslint-disable-next-line no-console
      console.error(error)
      return undefined
    }
  })


  try {
    return JSON.parse((completion?.choices[0].message.content || '').split('METAPHORS: ')[1])
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error parsing response:', error);
    if (tryCount < 2) return getPromptTextElements(openAiClient, essay, tryCount + 1)
    return []
  }
}

const prompter = (el: string) => {
  const lowerCased = el[0].toLowerCase() + el.slice(1)
  return `${shuffle(promptUrls)[0]} topographic watercolor artwork of ${lowerCased}, in the style of ethereal watercolor washes, ultrafine detail, juxtaposition of hard and soft lines, delicate ink lines, inspired by scientific illustrations, in the style of meditative pastel moebius, muted colors --ar 8:5 --v 6.0 `
}

const pressMidjourneyButton = async (messageId: string, button: string) => {
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
}

const saveImage = async (prompt: string, essay: Essay, url: string) => {
  const newUrl = await moveImageToCloudinary({oldUrl: url, originDocumentId: `splashArtImagePrompt${prompt}`})
  if (!newUrl) {
    // eslint-disable-next-line no-console
    console.error("Failed to upload image to cloudinary", prompt, essay)
    return
  }
  await createMutator({
    collection: ReviewWinnerArts,
    context: createAdminContext(),
    document: {
      postId: essay.post._id, 
      splashArtImagePrompt: prompt,
      splashArtImageUrl: newUrl
    }
  })
  return newUrl
}

const upscaledImages = async (el: string, essay: Essay, messageId: string): Promise<(string | undefined)[]> =>
  Promise.all(["U1","U2","U3","U4"]
    .map(async button => {
      return pressMidjourneyButton(messageId, button)
        .then(m => m && upscaleImage(m.messageId))
        .then(uri => uri && saveImage(el, essay, uri))
    }))

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
        // eslint-disable-next-line no-console
        console.error('Image generation failed:', responseData);
        return undefined
      }
      return responseData
    } else {
      await sleep(5_000)
      return checkOnJob(jobId)
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error getting updates', error);
    return checkOnJob(jobId)
  }
}

async function getEssayPromptJointImageMessage(promptElement: string): Promise<MyMidjourneyResponse|undefined> {
  let promptResponseData: any;
  let jobId: string;  
  try {
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
    return checkOnJob(jobId)
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error generating image:', error);
  }
}

async function generateCoverImages({limit = 2}: {
    limit?: number
} = {}): Promise<string[]> {
  const openAiClient = await getOpenAI()
  if (!openAiClient) {
    throw new Error('Could not initialize OpenAI client!');
  }
  const essays = (await getEssaysWithoutEnoughArt()).slice(0, limit)

  return await essays.reduce(async (prev: Promise<string[]>, essay: Essay): Promise<string[]> => {

    const prevUrls = await prev
    // 
    const imageUrls = await getPromptTextElements(openAiClient, essay)
      // go through text elements, limit it to the amount we need
      // for each of them , 
      .then((els: string[]) =>
        els.slice(0,Math.min(limit, essay.toGenerate))
          .reduce(async (prev, el) => {
            const existingImageUrls = await prev
            // get the image from midjourney
            const newImageUrls = await getEssayPromptJointImageMessage(el)
              .then(x => x === undefined ? Promise.resolve([]) : upscaledImages(el, essay, x.messageId))
              .then(urls => filterNonnull(urls))
            return [...existingImageUrls, ...newImageUrls]
          }, Promise.resolve([]) as Promise<string[]>))

    return [...prevUrls, ...imageUrls]
  }, Promise.resolve([]) as Promise<string[]>)
}

async function coverImages () {
  if (!myMidjourneyKey) {
    throw new Error('No MyMidjourney API key found!');
  }
  
  const newImages = await generateCoverImages({limit: 9999})
  if (newImages.length === 0) return
  await sleep(10_000)
  // There are often failures in the process of the generation. We run until we no longer have candidate essays
  await coverImages()
}

Globals.coverImages = coverImages
