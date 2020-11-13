// TODO; doc
import util from 'util'
import { PublicInstanceSetting } from '../instanceSettings'
import { DatabasePublicSetting } from '../publicSettings'

const databaseDebuggersSetting = new DatabasePublicSetting<string[]>('debuggers', [])
const instanceDebuggersSetting = new PublicInstanceSetting<string[]>('instanceDebuggers', [], 'optional')

type Logger = (...args: any[]) => void

const scopeIsActive = (scope: string): boolean => {
  // console.log('instanceDebuggersSetting.get()', instanceDebuggersSetting.get())
  if (databaseDebuggersSetting.get().includes(scope) || instanceDebuggersSetting.get().includes(scope)) {
    return true
  }
  return false
}

// See the file docstring for documentation
export const loggerConstructor = (scope: string): Logger => {
  // console.log('scope', scope)
  // console.lop('debuggersSetting', debuggersSetting.get())
  return (...args) => {
    // We get() the settings here, utilizing the get function's cacheing and
    // cache-refreshing features
    if (scopeIsActive(scope)) {
      let formattedArgs = args
      if (Meteor.isServer) {
        // Full-depth object logging
        formattedArgs = args.map(a => typeof a === 'object' ? util.inspect(a, false, null) : a)
      }
      // eslint-disable-next-line no-console
      console.log(`[${scope}]`, ...formattedArgs)
    } else {
      // TODO; remove
      // console.log('not logging', scope)
    }
  }
}

// Mostly this is to re-implement Vulcan functionality, but it actually seems
// quite nice and we should use it more
// TODO; use it more
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
