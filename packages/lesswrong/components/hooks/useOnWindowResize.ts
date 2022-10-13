import { useEffect } from 'react'

export const useOnWindowResize = (callback: () => void, callOnMount = false) => {
  useEffect(() => {
    if(callOnMount) {
      callback()
    }
    window.addEventListener('resize', callback)
    return () => window.removeEventListener('resize', callback)
  }, [callback, callOnMount])
}
