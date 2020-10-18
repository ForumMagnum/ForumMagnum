import bowser from 'bowser'
import { isClient } from '../executionEnvironment';

export const isMobile = () => {
  if (isClient &&
      window &&
      window.navigator &&
      window.navigator.userAgent) {

      return (bowser.mobile || bowser.tablet)
  }
  return false
}
