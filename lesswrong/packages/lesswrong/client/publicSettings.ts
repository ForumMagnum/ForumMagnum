import { setPublicSettings } from '../lib/settingsCache'

// Here we load publicSettings from the data we injected in a header in `renderPage.ts` 
setPublicSettings(window.publicSettings);
