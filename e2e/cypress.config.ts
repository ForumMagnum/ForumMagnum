import { defineConfig } from 'cypress'
import { addCypressTasks } from './cypress/plugins'

export default defineConfig({
  watchForFileChanges: true,
  defaultCommandTimeout: 15000,
  
  // Disable frame isolation. Something (maybe in Sentry or Intercom?) tries to
  // make a cross-frame request, which fails because (I think) the test
  // environment isn't https, or something like that. This caused some tests to
  // fail that were clearly things that were working. TODO: Figure out why this
  // is necessary and maybe take it out.
  chromeWebSecurity: false,
  
  retries: {
    runMode: 2,
    openMode: 0,
  },
  e2e: {
    setupNodeEvents: addCypressTasks,
    baseUrl: 'http://localhost:3000',
  },
})
