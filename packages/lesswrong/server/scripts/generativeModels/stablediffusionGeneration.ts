import { PublicInstanceSetting } from "../../../lib/instanceSettings";

const stableDiffusionApiKey = new PublicInstanceSetting<string | null>('stablediffusion.api', null, 'optional');

export async function generateImage(prompt: string) {
  if (!stableDiffusionApiKey) {
    throw new Error('Mising API key for Stable Diffusion!');
  }
  const myHeaders = new Headers();
  myHeaders.append("Content-Type", "application/json");
  
  const raw = JSON.stringify({
    "key": stableDiffusionApiKey.get(),
    "model_id": "midjourney",
    "prompt": prompt,
    "negative_prompt": "extra fingers, mutated hands, poorly drawn hands, poorly drawn face, deformed, ugly, blurry, bad anatomy, bad proportions, extra limbs, cloned face, skinny, glitchy, double torso, extra arms, extra hands, mangled fingers, missing lips, ugly face, distorted face, extra legs, anime",
    "width": "512",
    "height": "512",
    "samples": "1",
    "num_inference_steps": "30",
    "safety_checker": "no",
    "enhance_prompt": "yes",
    "seed": null,
    "guidance_scale": 7.5,
    "multi_lingual": "no",
    "panorama": "no",
    "self_attention": "no",
    "upscale": "no",
    // "embeddings_model": "embeddings_model_id",
    // "lora_model": "lora_model_id",
    "scheduler": "UniPCMultistepScheduler",
    "webhook": null,
    "track_id": null
  });
  
  const requestOptions = {
    method: 'POST',
    headers: myHeaders,
    body: raw,
    // redirect: 'follow'
  };

  try {
    const response = await fetch("https://stablediffusionapi.com/api/v4/dreambooth", requestOptions);
    const result = await response.json();
    return result.output[0]
  } catch (err) {
    return err.toString()
  }
}
