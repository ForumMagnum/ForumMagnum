//TODO: Handle this properly and refresh this API key
const imagine_key = 'j2nLphFvR72vRymDkIHuB0VcyDYTEruG'


const elements = [
  "An old, dog-eared green book",
  "Foggy path lit by a distant lighthouse",
  "Rough map sketched on a parchment",
  "Small cluster of golden nuggets",
  "Keys scattered on a philosopher's desk"
]

const prompter = (el: string) => `https://s.mj.run/Bkrf46MPWyo  Aquarelle book cover inspired by topographic river maps and mathematical diagrams and equations. ${el}. Fade to white --no text --ar 8:5 --iw 2.0 --s 250 --chaos 30 --v 6.0`


async function go(el: string) {
  let promptResponseData : any;
  // generate the image
  try {
    const response = await fetch('https://cl.imagineapi.dev/items/images/', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${imagine_key}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({prompt: prompter(el)})
    });

  promptResponseData = await response.json();
  console.log(promptResponseData);
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
          'Authorization': `Bearer ${imagine_key}`, // <<<< TODO: remember to change this
          'Content-Type': 'application/json'
        }
      })

      const responseData = await response.json()
      console.log(responseData)
      if (responseData.data.status === 'completed' || responseData.data.status === 'failed') {
        // stop repeating
        clearInterval(intervalId);
        console.log('Completed image detials', responseData.data);
      } else {
        console.log("Image is not finished generation. Status: ", responseData.data.status)
      }
    } catch (error) {
      console.error('Error getting updates', error);
      throw error;
    }
  }, 5000 /* every 5 seconds */);
  // TODO: add a check to ensure this does not run indefinitely
}

async function main () {
  let i = 0
  while (i < elements.length) {
    await go(elements[i])
    i++
  }
}

main()