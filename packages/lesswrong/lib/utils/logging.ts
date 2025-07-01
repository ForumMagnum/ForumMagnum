/*
 * For console logs that will be useful to someone else or in the future
 *
 * Logging functions are obtained by calling loggerConstructor, then can be used
 * in place of console.log. Instead of only being able to turn on debug for the
 * entire code base and then getting spammed, loggers have scope. Scopes are
 * idiomatically 'functionality-collection[-refinement]', ie: 'views-posts',
 * 'db-comments-find', etc., but can be any arbitrary string.
 *
 * Scoped logging can be turned on and off via your instance settings (so that
 * you can have local debug statements while you're connected to production) or
 * via database settings, so that you can turn on debugging without redeploying.
 *
 * Turn on logging by setting the database public setting `debuggers` to an
 * array containing your desired debugger, like so `['views-posts',
 * 'db-comments-find']`, or in your instance settings (settings-$env.json),
 * setting `instanceDebuggers` to the same.
 */
import util from 'util'
import { instanceDebuggersSetting } from '../instanceSettings'
import { databaseDebuggersSetting } from '../publicSettings'

const instanceDebuggers = instanceDebuggersSetting.get()

type Logger = (...args: any[]) => void

const manuallyEnabledDebuggers: string[] = []

const scopeIsActive = (scope: string): boolean => {
  // We only need to re-check the cache for database settings. Changing instance
  // settings requires a rebuild
  if (databaseDebuggersSetting.get().includes(scope) || instanceDebuggers.includes(scope) || manuallyEnabledDebuggers.includes(scope)) {
    return true
  }
  return false
}

// See the file docstring for documentation
export const loggerConstructor = (scope: string): Logger => {
  return (...args) => {
    // We check the settings here, utilizing the get function's cacheing and
    // cache-refreshing features
    if (scopeIsActive(scope)) {
      let formattedArgs = args
      if (util?.inspect) {
        // Full-depth object logging
        formattedArgs = args.map(a => typeof a === 'object' ? util.inspect(a, false, null) : a)
      }
      // eslint-disable-next-line no-console
      console.log(`[${scope}]`, ...formattedArgs)
    }
  }
}

// Mostly this is to re-implement Vulcan functionality, but it actually seems
// quite nice and we should use it more
export const logGroupConstructor = (scope: string) => {
  return {
    logGroupStart: (...args: any[]) => {
      if (scopeIsActive(scope)) {
        // eslint-disable-next-line no-console
        console.groupCollapsed(`[${scope}]`, ...args)
      }
    },
    logGroupEnd: () => {
      if (scopeIsActive(scope)) {
        // eslint-disable-next-line no-console
        console.groupEnd()
      }
    }
  }
}
