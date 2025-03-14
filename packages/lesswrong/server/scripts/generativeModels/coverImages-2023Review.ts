import OpenAI from 'openai';
import { zodResponseFormat } from "openai/helpers/zod";
import { z } from "zod";
import { getOpenAI } from '../../languageModels/languageModelIntegration.ts';
import { fetchFragment } from '../../fetchFragment.ts';
import ReviewWinners from '../../../lib/collections/reviewWinners/collection.ts';
import ReviewWinnerArts from '../../../lib/collections/reviewWinnerArts/collection.ts';
import { moveImageToCloudinary } from '../convertImagesToCloudinary.ts';
import shuffle from 'lodash/shuffle';
import { cons } from 'fp-ts/lib/ReadonlyNonEmptyArray';
import { fal } from '@fal-ai/client';
import { falApiKey } from '@/lib/instanceSettings.ts';  
import type { RunOptions, Result } from '@fal-ai/client';
import { createAdminContext } from '../../vulcan-lib/query.ts';
import { createMutator } from '../../vulcan-lib/mutators.ts';
import sample from 'lodash/sample';
import SplashArtCoordinates from '../../../lib/collections/splashArtCoordinates/collection.ts';


const promptImageUrls = [
  "https://res.cloudinary.com/lesswrong-2-0/image/upload/v1705201417/ohabryka_Topographic_aquarelle_book_cover_by_Thomas_W._Schaller_f9c9dbbe-4880-4f12-8ebb-b8f0b900abc1_xvecay.png",

  "https://res.cloudinary.com/lesswrong-2-0/image/upload/v1741915943/raemon777_httpss.mj.runvqNA-Ykxa4U_watercolor_--no_circle_--a_e526384c-ca72-42e3-b0f8-aae57e7f3ca0_3_jwacbe.png",

  "https://res.cloudinary.com/lesswrong-2-0/image/upload/v1741915926/raemon777_httpss.mj.runvqNA-Ykxa4U_watercolor_--no_circle_--a_e526384c-ca72-42e3-b0f8-aae57e7f3ca0_3_zybtog.png",

  "https://res.cloudinary.com/lesswrong-2-0/image/upload/v1741915911/raemon777_httpss.mj.runvqNA-Ykxa4U_watercolor_--no_circle_--a_e526384c-ca72-42e3-b0f8-aae57e7f3ca0_3_j57fgb.png",

  "https://res.cloudinary.com/lesswrong-2-0/image/upload/v1741915911/raemon777_httpss.mj.runvqNA-Ykxa4U_watercolor_--no_circle_--a_e526384c-ca72-42e3-b0f8-aae57e7f3ca0_3_j57fgb.png"
]

const prompter = (el: string) => {
  const lowerCased = el[0].toLowerCase() + el.slice(1)
  return `${lowerCased}, aquarelle artwork fading out to the left, in the style of ethereal watercolor washes, clear focal point, juxtaposition of hard and soft lines, muted colors, textured paper drenched in watercolor, aquarelle, smooth color gradients, ethereal watercolor, beautiful fade to white, white, soaking wet watercolors fading into each other, smooth edges, topographic maps, left side of the image is fading to white right side has a visceral motif, left fade right intense, image fades to white on left, left side white, smooth texture`
}

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

You must respond in valid JSON format with the following structure:
{  
  "metaphors": ["metaphor 1", "metaphor 2", "metaphor 3"]
}

===

${title}

${essay}`


const saveImage = async (prompt: string, essay: Essay, url: string) => {
  // Take first 32 characters of the prompt, removing any whitespace
  const shortPrompt = prompt.trim().replace(/\s+/g, '_').slice(0, 32);
  const originId = `${essay.title}_${shortPrompt}_${Math.random()}`;
  
  const newUrl = await moveImageToCloudinary({oldUrl: url, originDocumentId: originId})
  if (!newUrl) {
    // eslint-disable-next-line no-console
    console.error("Failed to upload image to cloudinary", {prompt, essay})
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

  // Add coordinates for the new art
  if (reviewWinnerArt.data) {
    await createMutator({
      collection: SplashArtCoordinates,
      context: createAdminContext(),
      document: {
        reviewWinnerArtId: reviewWinnerArt.data._id,
        // These are example values - you may want to adjust these based on your needs
        leftXPct: 0,
        leftYPct: 0,
        leftHeightPct: 100,
        leftWidthPct: 33.33,
        leftFlipped: false,
        middleXPct: 33.33,
        middleYPct: 0,
        middleHeightPct: 100,
        middleWidthPct: 33.33,
        middleFlipped: false,
        rightXPct: 66.66,
        rightYPct: 0,
        rightHeightPct: 100,
        rightWidthPct: 33.33,
        rightFlipped: false
      }
    });
  }
  
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

const TextResponseFormat = zodResponseFormat(z.object({
  metaphors: z.array(z.string()),
}), "TextResponseFormat")

const getPromptTextElements = async (openAiClient: OpenAI, essay: {title: string, content: string}, tryCount = 0): Promise<string[]> => {
  const content = essay.content.length > 25_000 ? essay.content.slice(0, 12_500) + "\n[EXCERPTED FOR LENGTH]\n" + essay.content.slice(-12_500) : essay.content
  const completion = await openAiClient.chat.completions.create({
    messages: [{role: "user", content: llm_prompt(essay.title, content)}],
    model: "o3-mini",
    response_format:TextResponseFormat
  }).catch((error) => {
    if (error instanceof OpenAI.APIError && error.status === 400 && error.code === 'context_length_exceeded') {
      return openAiClient.chat.completions.create({
        messages: [{role: "user", content: llm_prompt(essay.title, content.slice(0, 8_000) + "\n[EXCERPTED FOR LENGTH]\n" + essay.content.slice(-8_000))}],
        model: "o3-mini-2025-1-31",
        response_format: TextResponseFormat
      })
    } else {
      // eslint-disable-next-line no-console
      console.error("THIS IS THE ERROR",error)
      return undefined
    }
  })
  try {
    const json = completion?.choices[0].message.content
    return JSON.parse(json ?? "{}").metaphors
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error parsing response:', error);
    if (tryCount < 2) return getPromptTextElements(openAiClient, essay, tryCount + 1)
    return []
  }
}

fal.config({
  credentials: "58d6adef-e55d-4149-9d2a-ae9f75f38741:2b8d3ce1154bcc3c66ec87b60d62cc42"
});

const generateImage = async (prompt: string, imageUrl: string): Promise<string> => {
  // eslint-disable-next-line no-console
  console.log(`generating image for ${prompt}`)
  try {
    const runOptions = {
      input: {
        prompt: prompt,
        negative_prompt: "text, writing, words, low quality, blurry, abstract, pattern, labyrinth, maze, circles, orbs",
        num_inference_steps: 25,
        guidance_scale: 7.5,
        aspect_ratio: "4:3" as const,
        image_size: {
          width: 2048,
          height: 1536
        },
        image_url: imageUrl,
        image_strength: 1
      }
    }
    const result = await fal.subscribe("fal-ai/flux-pro/v1.1-ultra/redux", runOptions);

    // eslint-disable-next-line no-console
    console.log(result)
    return result.data.images[0].url;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error generating image:', error);
    throw error;
  }
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
    const image = await generateImage(prompt, sample(promptImageUrls)!)
    const reviewWinnerArt = (await saveImage(prompt, essay, image))?.data
    return {title: essay.title, prompt, imageUrl: image, reviewWinnerArt}
  }))
  return results
}

export const getReviewWinnerArts = async () => {
  console.log("Running getReviewWinnerArts")
  const essays = (await getEssaysWithoutEnoughArt())
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
  console.log(results.map(r => r.map(r => r.reviewWinnerArt)))
}
