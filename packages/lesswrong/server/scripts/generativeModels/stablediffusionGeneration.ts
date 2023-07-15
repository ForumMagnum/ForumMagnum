

export async function generateImage(prompt: string) {
  var myHeaders = new Headers();
  myHeaders.append("Content-Type", "application/json");
  
  var raw = JSON.stringify({
    "key": "cbXBiLt05agETjJtHWQbAGw053LFQltLg2PlHwKwQ0GfeEW1MZmEH6jTTUn4",
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
  
  var requestOptions = {
    method: 'POST',
    headers: myHeaders,
    body: raw,
    // redirect: 'follow'
  };

  try {
    let response = await fetch("https://stablediffusionapi.com/api/v4/dreambooth", requestOptions);
    let result = await response.text();
    return JSON.parse(result).output[0]
  } catch (err) {
    return err.toString()
  }
}
