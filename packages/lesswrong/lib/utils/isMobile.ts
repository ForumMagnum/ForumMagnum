import bowser from 'bowser'
import { Meteor } from 'meteor/meteor';

export const isMobile = () => {
  if (Meteor.isClient &&
      window &&
      window.navigator &&
      window.navigator.userAgent) {

      return (bowser.mobile || bowser.tablet)
  }
  return false
}
