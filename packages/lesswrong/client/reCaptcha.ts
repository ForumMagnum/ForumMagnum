import { reCaptchaSiteKeySetting } from '../lib/publicSettings';

// Load and run ReCaptcha script on client
const script = document.createElement('script')
script.src = `https://www.google.com/recaptcha/api.js?render=${reCaptchaSiteKeySetting.get()}`
document.body.appendChild(script)

