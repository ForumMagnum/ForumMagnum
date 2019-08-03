import bowser from 'bowser'

export const isMobile = () => {
  if (Meteor.isClient &&
      window &&
      window.navigator &&
      window.navigator.userAgent) {

      return (bowser.mobile || bowser.tablet)
  }
  return false
}
