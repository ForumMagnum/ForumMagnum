import { getSetting } from '../lib/vulcan-lib';
const reCaptchaSiteKey = getSetting('reCaptcha.apiKey')

// Load and run ReCaptcha script on client
const script = document.createElement('script')
script.src = `https://www.google.com/recaptcha/api.js?render=${reCaptchaSiteKey}`
document.body.appendChild(script)

