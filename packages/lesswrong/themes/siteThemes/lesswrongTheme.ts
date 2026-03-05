import { headerStack, sansSerifStack, serifStack } from "../defaultPalette";

export const lessWrongTheme: SiteThemeSpecification = {
  componentPalette: (dark: boolean) => ({
  }),
  make: (palette: ThemePalette) => ({
    typography: {
      fontFamily: sansSerifStack,
      postStyle: {
        fontFamily: serifStack,
      },
      headerStyle: {
        fontFamily: headerStack,
      },
      caption: {
        // captions should be relative to their surrounding content, so they are unopinionated about fontFamily and use ems instead of rems
        fontFamily: "unset",
        fontSize: '.85em'
      },
      body2: {
        fontSize: 15.08,
        lineHeight: "19.8px"
      },
      commentStyle: {
        fontFamily: sansSerifStack,
        '& b, & strong': {
          fontWeight: 600
        }
      },
      errorStyle: {
        color: palette.error.main,
        fontFamily: sansSerifStack
      },
      headline: {
        fontFamily: serifStack,
      },
      subheading: {
        fontFamily: serifStack,
      },
      title: {
        fontFamily: headerStack,
        fontWeight: 500,
      },
      uiSecondary: {
        fontFamily: serifStack,
      },
    },
    overrides: {
      MuiListItem: {
        root: {
          paddingTop: 8,
          paddingBottom: 8
        }
      },
    },

    isBookUI: true,
    isFriendlyUI: false,
    isLW: true,
    isAF: false,
    isLWorAF: true,
    isEAForum: false,
  }),
};
