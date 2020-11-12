const DEBUG_SETTINGS = {views: ['Post']}

type Logger = (...args: any[]) => void

//to do: make scope and collection typed strings
// to do: make collection optional
//todo: use plural version of collections
export const loggerConstructor = (scope: string, collection: string): Logger => {
  console.log(scope, collection)
  if(DEBUG_SETTINGS[scope].includes(collection)) {
    return (...args) => console.log(`${scope}:${collection}`, ...args)
  }
  return () => {}
}
