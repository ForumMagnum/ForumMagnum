import { publicSettings } from '../lib/settingsCache'

// Here we modify the publicSettings object with the data we injected in a header in `renderPage.ts` 
Object.assign(publicSettings, (window as any).publicSettings)
