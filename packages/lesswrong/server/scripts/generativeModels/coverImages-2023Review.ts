import OpenAI from 'openai';
import { getOpenAI } from '../../languageModels/languageModelIntegration.ts';
import { createAdminContext, createMutator, Globals } from '../../vulcan-lib/index.ts';
import { fetchFragment } from '../../fetchFragment.ts';
import ReviewWinners from '../../../lib/collections/reviewWinners/collection.ts';
import ReviewWinnerArts from '../../../lib/collections/reviewWinnerArts/collection.ts';
import { moveImageToCloudinary } from '../convertImagesToCloudinary.ts';
import shuffle from 'lodash/shuffle';
import { cons } from 'fp-ts/lib/ReadonlyNonEmptyArray';

const FAL_API_KEY = '58d6adef-e55d-4149-9d2a-ae9f75f38741:2b8d3ce1154bcc3c66ec87b60d62cc42'

const promptUrls = [
  "https://s.mj.run/W91s58GkTUs",
  "https://s.mj.run/D5okH4Ak-mw",
  "https://s.mj.run/1aM-y0W73aA",
  //"https://s.mj.run/JAlgYmUiOdc", this is no longer available
]

export const llm_prompt = (title: string, essay: string) => `I am creating cover art for essays that will be featured on LessWrong. For each piece of art, I want a clear visual metaphor that captures the essence of the essay.

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


const saveImage = async (prompt: string, essay: Essay, url: string) => {
  const newUrl = await moveImageToCloudinary({oldUrl: url, originDocumentId: `splashArtImagePrompt${prompt}`})
  if (!newUrl) {
    // eslint-disable-next-line no-console
    console.error("Failed to upload image to cloudinary", prompt, essay)
    return
  }
  const reviewWinnerArt = await createMutator({
    collection: ReviewWinnerArts,
    context: createAdminContext(),
    document: {
      postId: essay.post._id, 
      splashArtImagePrompt: prompt,
      splashArtImageUrl: newUrl
    }
  })
  return reviewWinnerArt
}

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



const generateImage = async (prompt: string, imageUrl?: string): Promise<string> => {
  // eslint-disable-next-line no-console
  console.log(`generating image for ${prompt}`)
  try {
    const body: any = {
      prompt: prompt,
      negative_prompt: "text, writing, words, low quality, blurry",
      num_inference_steps: 25,
      guidance_scale: 7.5,
      size: {
        width: 1600,
        height: 900
      }
    };

    // Add image_url if provided
    if (imageUrl) {
      body.image_url = imageUrl;
      body.strength = 0.7; // Controls how much to preserve from original image (0-1)
    }

    const response = await fetch('https://110602490-fast-sdxl.gateway.alpha.fal.ai/', {
      method: 'POST',
      headers: {
        'Authorization': `Key ${FAL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }

    const result = await response.json();
    // eslint-disable-next-line no-console
    console.log(result)
    return result.images[0].url;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error generating image:', error);
    throw error;
  }
}

const prompter = (el: string) => {
  const lowerCased = el[0].toLowerCase() + el.slice(1)
  return `${shuffle(promptUrls)[0]} topographic watercolor artwork of ${lowerCased}, in the style of ethereal watercolor washes, ultrafine detail, juxtaposition of hard and soft lines, delicate ink lines, inspired by scientific illustrations, in the style of meditative pastel moebius, muted colors --ar 8:5 --v 6.0 `
}

const getPrompts = async (openAiClient: OpenAI, essay: {title: string, content: string}): Promise<string[]> => {
  const promptElements = await getPromptTextElements(openAiClient, essay)
  return promptElements.map(el => prompter(el))
}


type EssayResult = {
  title: string,
  prompt: string, 
  imageUrl: string, 
  reviewWinnerArt?: DbReviewWinnerArt
}

const getArtForEssay = async (openAiClient: OpenAI, essay: Essay): Promise<EssayResult[]> => {
  // eslint-disable-next-line no-console
  console.log(`getting art for ${essay.title}`)
  const prompts = await getPrompts(openAiClient, essay)

  const results = Promise.all(prompts.map(async (prompt) => {
    const imageUrl = "https://res.cloudinary.com/lesswrong-2-0/image/upload/c_crop,g_custom/c_fill,dpr_auto,q_auto,f_auto,g_auto:faces/ohabryka_Topographic_aquarelle_book_cover_by_Thomas_W._Schaller_f9c9dbbe-4880-4f12-8ebb-b8f0b900abc1_m4k6dy_734413"

    const image = await generateImage(prompt, imageUrl)
    const reviewWinnerArt = (await saveImage(prompt, essay, image))?.data
    return {title: essay.title, prompt, imageUrl, reviewWinnerArt}
  }))
  return results
}

const getEssayPrompts = async () => {
  const essays = (await getEssaysWithoutEnoughArt()).slice(0, 1)
  const openAiClient = await getOpenAI()
  if (!openAiClient) {
    throw new Error('Could not initialize OpenAI client!');
  }

  const results: EssayResult[][] = await Promise.all(essays.map(async (essay) => {
    return getArtForEssay(openAiClient, essay)
  }))
  // eslint-disable-next-line no-console
  console.log("\n\nResults:")
  // eslint-disable-next-line no-console
  console.log(results)
}

Globals.getEssayPrompts = getEssayPrompts
