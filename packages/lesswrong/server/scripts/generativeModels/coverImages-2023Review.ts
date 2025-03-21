import OpenAI from 'openai';
import { zodResponseFormat } from "openai/helpers/zod";
import { z } from "zod";
import { getOpenAI } from '../../languageModels/languageModelIntegration.ts';
import { fetchFragment } from '../../fetchFragment.ts';
import ReviewWinners from '@/server/collections/reviewWinners/collection.ts';
import ReviewWinnerArts from '@/server/collections/reviewWinnerArts/collection.ts';
import { moveImageToCloudinary } from '../convertImagesToCloudinary.ts';
import { fal } from '@fal-ai/client';
import { createAdminContext } from '../../vulcan-lib/query.ts';
import { createMutator } from '../../vulcan-lib/mutators.ts';
import sample from 'lodash/sample';
import SplashArtCoordinates from '@/server/collections/splashArtCoordinates/collection.ts';
import { falApiKey } from '@/lib/instanceSettings.ts';


const promptImageUrls = [
  "https://res.cloudinary.com/lesswrong-2-0/image/upload/v1705201417/ohabryka_Topographic_aquarelle_book_cover_by_Thomas_W._Schaller_f9c9dbbe-4880-4f12-8ebb-b8f0b900abc1_xvecay.png",

  "https://res.cloudinary.com/lesswrong-2-0/image/upload/v1741915943/raemon777_httpss.mj.runvqNA-Ykxa4U_watercolor_--no_circle_--a_e526384c-ca72-42e3-b0f8-aae57e7f3ca0_3_jwacbe.png",

  "https://res.cloudinary.com/lesswrong-2-0/image/upload/v1741915926/raemon777_httpss.mj.runvqNA-Ykxa4U_watercolor_--no_circle_--a_e526384c-ca72-42e3-b0f8-aae57e7f3ca0_3_zybtog.png",

  "https://res.cloudinary.com/lesswrong-2-0/image/upload/v1741915911/raemon777_httpss.mj.runvqNA-Ykxa4U_watercolor_--no_circle_--a_e526384c-ca72-42e3-b0f8-aae57e7f3ca0_3_j57fgb.png",
]

const prompter = (el: string) => {
  const lowerCased = el[0].toLowerCase() + el.slice(1)
  return `${lowerCased}, aquarelle artwork fading out to the left, in the style of ethereal watercolor washes, clear focal point on the right half of image, juxtaposition of hard and soft lines, muted colors, smooth color gradients, ethereal, beautiful fade to white, white, soaking wet watercolors fading into each other, smooth edges, topographic maps, left side of the image is fading to white, right side has a visceral motif, left fade right intense, image fades to white on left, left side white, smooth texture`
}


const prompterOld = (el: string) => {
  const lowerCased = el[0].toLowerCase() + el.slice(1)
  return `${lowerCased}, aquarelle artwork fading out to the left, in the style of ethereal watercolor washes, clear focal point on the right half of image, juxtaposition of hard and soft lines, muted colors, drenched in watercolor, aquarelle, smooth color gradients, ethereal watercolor, beautiful fade to white, white, soaking wet watercolors fading into each other, smooth edges, topographic maps, left side of the image is fading to white, right side has a visceral motif, left fade right intense, image fades to white on left, left side white, smooth texture`
}

export const llm_prompt = (title: string, essay: string) => `I am creating cover art for essays that will be featured on LessWrong. For each piece of art, I want a clear description of a visual illustration that captures the essence of the essay.

The illustration description should be concrete and specific, and should be something that can be depicted in a single image. The description should be something that is both visually striking and that captures the essence of the essay in a way that is likely to be interesting. It should be 5 - 15 words long.

I want you to list 10 visual illustration descriptions for the essay.

If the essay specifically mentions something you can easily visualize, use that as one of the illustrations. If the title of the essay lends itself to a clear visual illustration, include that.

The image should not contain any text. It should not have any writing. It should not refer to the content of written materials. It should not ask for symbols representing concepts, but instead ask for concrete images (it's fine if you intend them to represent something, but you should figure out the specific concrete images to represent that thing). Do not use "mazes", or "labryinth" or "neural net" as your illustrations.

If the essay only really talks about learning, metalearning, or other abstract concepts, consider a wide variety of illustrations.

If the essay contains any particular images or visual illustrations, feel free to use those in the answers.

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
4. A labyrinth of forking paths

Please generate 10 visual illustrations for the essay that will appear on Lesswrong. The essay will appear after the "===".

Please format your response as follows:

SUMMARY: What is the main idea of the essay?
IDEAS: A JSON list of 3 visual illustrations, like ["a sea of thousands of people, one of them zoomed in using a magnifying glass", "a set of scales with a heap of gold on one side and a heart on the other", "a tree with tangled roots and a single leaf"]
CHECK: For each illustration, write out the illustration and answer (a) does the illustration contain writing or refer to the content of written materials or say that words should appear in the image? (yes/no) (b) Does the illustration ask for any symbols respresenting concepts? (yes/no) Is it 5 to 15 words long? (yes/no)
CORRECTIONS: If any of the illustrations contain writing or refer to the content of written materials, please provide a corrected version of the illustration.
ILLUSTRATIONS: A JSON list of your final 3 visual illustrations.

You must respond in valid JSON format with the following structure:
{  
  "illustrations": ["illustration 1", "illustration 2", "illustration 3", "illustration 4", "illustration 5", "illustration 6", "illustration 7", "illustration 8", "illustration 9", "illustration 10"]
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
        leftXPct: 0,
        leftYPct: 0,
        leftWidthPct: .33,
        leftHeightPct: 1,
        leftFlipped: false,
        middleXPct: .33,
        middleYPct: 0,
        middleWidthPct: .33,
        middleHeightPct: 1,
        middleFlipped: false,
        rightXPct: .66,
        rightYPct: 0,
        rightWidthPct: .33,
        rightHeightPct: 1, 
        rightFlipped: false,
      }
    });
  }
  
  return reviewWinnerArt
}

const getEssaysWithoutEnoughArt = async (): Promise<Essay[]> => {
  const targetAmountOfArt = 100

  const postIds = await ReviewWinners.find({reviewYear: 2023}, { projection: { postId: 1, reviewYear: 1 }, sort: { reviewRanking: 1 } }).fetch();

  const reviewArts = await ReviewWinnerArts.find({}).fetch();

  const postIdsWithoutEnoughArt = postIds
  .filter(p => reviewArts.filter(a => a.postId === p.postId).length < (targetAmountOfArt * .9))

  const essays = await fetchFragment({
    collectionName: "Posts",
    fragmentName: "PostsPage",
    selector: {_id: {$in: postIdsWithoutEnoughArt.map(p => p.postId)}},
    currentUser: null,
    skipFiltering: true,
  });

  return essays.map(e => {
    const existingArtCount = reviewArts.filter(a => a.postId === e._id).length;
    const neededArtCount = Math.max(0, targetAmountOfArt - existingArtCount);
    return {post: e, title: e.title, content: e.contents?.html ?? "", neededArtCount}
  })
}

type Essay = {post: PostsPage, title: string, content: string, neededArtCount: number}

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
  credentials: falApiKey.get()
});

const generateImage = async (prompt: string, imageUrl: string): Promise<string> => {
  // eslint-disable-next-line no-console
  try {
    const runOptions = {
      input: {
        prompt: prompt,
        negative_prompt: "text, writing, words, low quality, blurry, abstract, pattern, labyrinth, maze, circles, orbs",
        num_inference_steps: 25,
        guidance_scale: 7.5,
        // aspect_ratio: "4:3" as const, 
        image_size: {
          width: 2048,
          height: 1536
        },
        image_url: imageUrl,
        image_strength: .2
      }
    }
    const result = await fal.subscribe("fal-ai/flux-pro/v1.1-ultra/redux", runOptions);

    // eslint-disable-next-line no-console
    // console.log(result)
    return result.data.images[0].url;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error generating image:', error);
    // eslint-disable-next-line no-console
    console.log("prompt", prompt)
    console.log("imageUrl", imageUrl)
    throw error;
  }
}

const generateHighResImage = async (essay: Essay, prompt: string, imageUrl: string): Promise<string> => {
  // First pass: Generate high-quality image with flux-pro
  const fluxResult = await generateImage(prompt, imageUrl);
  
  // Second pass: Upscale with CCSR
  try {
    const upscaleOptions = {
      input: {
        image_url: fluxResult,
        // CCSR specific settings for best quality
        scale: 1.35
      }
    };
    
    const result = await fal.subscribe("fal-ai/esrgan", upscaleOptions);
    // eslint-disable-next-line no-console
    console.log("result", essay.title, prompt.split(", aquarelle artwork fading")[0])
    // eslint-disable-next-line no-console
    console.log("upscaled", result.data.image.url)
    return result.data.image.url;
    
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error upscaling image:', error);
    // Fall back to the flux-pro result if upscaling fails
    return fluxResult;
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
  console.log("essay", essay.title, essay.neededArtCount)
  const prompts = await getPrompts(openAiClient, essay)
  const promptCount = Math.floor(essay.neededArtCount/prompts.length)
  const promptsTotal = prompts.flatMap(p => Array(promptCount).fill(p))
  console.log("promptsTotal", promptsTotal.length)
  const results = Promise.all(promptsTotal.map(async (prompt) => {
    const image = await generateHighResImage(essay, prompt, sample(promptImageUrls)!)
    const reviewWinnerArt = (await saveImage(prompt, essay, image))?.data
    return {title: essay.title, prompt, imageUrl: image, reviewWinnerArt}
  }))
  return results
}

export const getReviewWinnerArts = async () => {
  // eslint-disable-next-line no-console
  console.time('running getReviewWinnerArts');

  const totalEssays = (await getEssaysWithoutEnoughArt())
  const essays = totalEssays.slice(0, 1)

  const openAiClient = await getOpenAI()
  if (!openAiClient) {
    throw new Error('         Could not initialize OpenAI client!');
  }

  const results: EssayResult[][] = await Promise.all(essays.map(async (essay) => {
    return getArtForEssay(openAiClient, essay)
  }))

  // eslint-disable-next-line no-console
  console.log("\n\nResults:")
  // eslint-disable-next-line no-console
  const uniqueResults = results.map(r => {
    const uniqueResults = r.reduce((acc, curr) => {
      if (!acc.find(item => item.title === curr.title)) {
        acc.push({
          title: curr.title,
          prompt: curr.prompt,
          url: curr.reviewWinnerArt?.splashArtImageUrl,
          artId: curr.reviewWinnerArt?._id
        });
      }
      return acc;
    }, [] as Array<{title: string, prompt: string, url?: string, artId?: string}>);
    return uniqueResults;
  })
  // eslint-disable-next-line no-console
  console.log(`${results.length} cover images generated for ${uniqueResults.length} essays`)
}
