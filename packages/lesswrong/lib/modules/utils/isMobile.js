import bowser from 'bowser'
// import { useTheme } from '@material-ui/styles'
// // This becomes stable in the next version
// import { unstable_useMediaQuery as useMediaQuery } from '@material-ui/core/useMediaQuery'

export const isMobile = () => {
  if (Meteor.isClient &&
      window &&
      window.navigator &&
      window.navigator.userAgent) {

      return (bowser.mobile || bowser.tablet)
  }
  return false
}

// // https://v3.material-ui.com/layout/breakpoints/#withwidth
// export const isMobileByWidth = (width, options = {mdIsMobile: true}) => {
//   const { mdIsMobile } = options
//   return {
//     xs: true,
//     sm: true,
//     md: mdIsMobile,
//     lg: false,
//     xl: false,
//   }[width]
// }

// const defaultOptions =  {mdIsMobile: true, ssrDefaultIsMobile: false}
// export const isMobileByScreensize = (options) => {
//   const { mdIsMobile, ssrDefaultIsMobile } = {...defaultOptions, ...options}
//   const theme = useTheme();
//   const crossoverBreakpoint = theme.breakpoints.down(mdIsMobile ? 'md' : 'sm')
//   const isMobile = useMediaQuery(crossoverBreakpoint)
// }
