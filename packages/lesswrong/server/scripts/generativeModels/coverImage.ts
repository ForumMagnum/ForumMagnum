import { imagine_key, openai_key, openai_org, slack_api_token } from './keys.ts'
import OpenAI from 'openai'
import axios from 'axios';
import FormData from 'form-data';
import { Globals } from '../../vulcan-lib/index.ts';
import Posts from '../../../lib/collections/posts/collection.ts';


const maxSimultaneousMidjourney = 3
let currentMidjourney = 0

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

const releaseMidjourneyRights = () => {
  currentMidjourney--
}

const openai = new OpenAI({
  apiKey: openai_key,
  organization: openai_org
})

const llm_prompt = (essay: string) => `Please generate 5 phrases, each 1 to 7 words long. They should describe simple concrete objects and  will go in this instruction for an image prompt: "Aquarelle book cover inspired by topographic river maps and mathematical diagrams and equations. [BLANK]. Fade to white"

Some examples for other essays would be:
* "Coins and shaking hands"
* "A magnifying glass"
* "A tree with people gathered around"

They should not be things like:
* A scientist understanding a new topic [too abstract]
* The logo of an old internet forum [too generic]

They should be phrases such that I can use this as a prompt to illustrate the following essay, by being concrete objects that are visual metaphors for the idea of the essay.

Please format your response as a JSON list.

===

${essay}`

const getEssays = async () : Promise<Essay[]> => {
  const es = await Posts.find({
    "postedAt": {"$gte": new Date("2021-01-01"), "$lt": new Date("2022-01-01")},
    "draft": false,
  }, {sort: {"reviewVoteScoreHighKarma": -1}, limit: 50, projection: {title: 1, contents: 1, reviewVoteScoreHighKarma: 1}})
  .fetch()
  return es.map(e => {
    return {title: e.title, content: e.contents.html }
  })
}

type Essay = {title: string, content: string, threadTs?: string}

const getElements = async (essay: {title: string, content: string}): Promise<string[]> => {
  const completion = await openai.chat.completions.create({
    messages: [{role: "user", content: llm_prompt(essay.content)}],
    model: "gpt-4",
  });

  try {
    return JSON.parse(completion.choices[0].message.content || '')
  } catch (error) {
    console.error('Error parsing response:', error);
    throw error;
  }
}

const prompter = (el: string) => `https://s.mj.run/Bkrf46MPWyo  Aquarelle illustration inspired by topographic river maps and mathematical diagrams and equations. A clear image of ${el} --no text --ar 8:5 --iw 2.0 --s 150 --chaos 10 --v 6.0`

const postPromptImages = async (prompt: string, {title, threadTs}: {title: string, threadTs?: string}, images: string[]) => {
  if (!threadTs) return
  await postReply(`*Prompt: ${prompt}*`, threadTs);
  return await Promise.all(images.map(async (image) => {
    const response = await axios.get(image, {responseType: 'arraybuffer'})
    console.log(response)
    const formData = new FormData()
    formData.append('file', response.data)
    formData.append('thread_ts', threadTs)
    console.log(formData)
    const postResponse = await axios.post('https://slack.com/api/files.upload', formData, {
      headers: {
        'Authorization': `Bearer ${slack_api_token}`,
        'Content-Type': 'multipart/form-data',
      }, maxContentLength: Infinity
      })
      // console.log(postResponse)
      console.log(postResponse.data)
  }))
}

async function go(essays: Essay[], essayIx: number, el: string) {
  let promptResponseData : any;
  // generate the image
  try {
    await acquireMidjourneyRights()
    const response = await fetch('https://cl.imagineapi.dev/items/images/', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${imagine_key}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({prompt: prompter(el)})
    });

    promptResponseData = await response.json();
    // console.log(promptResponseData);
  } catch (error) {
    console.error('Error generating image:', error);
    throw error;
  }

  // check if the image has finished generating
  // let's repeat this code every 5000 milliseconds (5 seconds, set at the bottom)
  const intervalId = setInterval(async function () {
    try {
      console.log('Checking image details');
      const response = await fetch(`https://cl.imagineapi.dev/items/images/${promptResponseData.data.id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${imagine_key}`,
          'Content-Type': 'application/json'
        }
      })

      const responseData = await response.json()
      // console.log(responseData)
      if (responseData.data.status === 'completed') {
        // stop repeating
        clearInterval(intervalId);
        await postPromptImages(el, essays[essayIx], responseData.data.upscaled_urls)
        releaseMidjourneyRights()
        // console.log('Completed image details', responseData.data);
      } else {
        // console.log("Image is not finished generation. Status: ", responseData.data.status)
      }
    } catch (error) {
      console.error('Error getting updates', error);
      throw error;
    }
  }, 5000 /* every 5 seconds */);
  // TODO: add a check to ensure this does not run indefinitely
}

const slackToken = slack_api_token
const channelId = 'C06G79HMK9C';

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
  // const limit = 1
  // const essays = (await getEssays()).slice(0, limit)
  // await Promise.all(essays.map(makeEssayThread))
  // const elementss = await Promise.all(essays.slice(0, limit).map(getElements))
  // await Promise.all(
  //   elementss.slice(0,limit)
  //   .map((els,i) => els.slice(1).map(el => go(essays, i, el)))
  // )
  await postPromptImages('test', {title: 'test', threadTs: 'p1706745567571679'}, ['https://cdn.discordapp.com/attachments/1202405316231299112/1202405771225079818/lwbot_Aquarelle_illustration_inspired_by_topographic_river_maps_a0467f69-0f26-4760-9544-9bf022abe9db.png?ex=65cd56a3&is=65bae1a3&hm=aa8518f72e38cdd3dcb740499723912e18541b50eceb36cd85cbb096e0218906&'])
}

Globals.coverImages = () => main()
