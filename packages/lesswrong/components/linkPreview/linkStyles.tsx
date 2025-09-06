import { visitedLinksHaveFilledInCircle } from '@/lib/betas';
import { defineStyles } from '../hooks/useStyles';

export const linkStyles = defineStyles("LinkStyles", (theme: ThemeType) => ({
  link: {
    ...(visitedLinksHaveFilledInCircle()
      ? {
        '&:after': {
          content: '""',
          top: -7,
          position: "relative",
          marginLeft: 2,
          marginRight: 0,
          width: 4,
          height: 4,
          display: "inline-block",

          // The center of the link-circle is the page-background color, rather
          // than transparent, because :visited cannot change background
          // opacity. Technically, this means that if a link appears on a
          // non-default background, the center of the circle is the wrong
          // color. I'm able to detect this on even-numbered replies (which
          // have a gray background) if I use a magnifier/color-picker, but
          // can't detect it by eye, so this is probably fine.
          background: theme.palette.background.default,
          border: `1.2px solid ${theme.palette.link.color ?? theme.palette.primary.main}`,
          borderRadius: "50%",
        },

        // Visited styles can be applied for two reasons: based on the :visited
        // selector (which is applied by the browser based on local browser
        // history), or based on the .visited class (which is applied by link
        // components for logged-in users based on the read-status of the
        // destination, in the DB).
        //
        // `visited` is a string-classname rather than something that gets
        // prefixed, because some broadly-applied styles in `stylePiping` also use
        // it.
        //
        // Because of browser rules intended to prevent history-sniffing, the
        // attributes that can appear in this block, if it's applied via the
        // :visited selector rather than the .visited class, are highly
        // restricted. In particular, the `background` attribute can change
        // color, but it cannot change opacity.
        "&:visited:after, &.visited:after": {
          background: theme.palette.link.visited ?? theme.palette.primary.main,
          border: `1.2px solid ${theme.palette.link.visited ?? theme.palette.primary.main}`,
        },
      } : {
        '&:after': {
          content: '"°"',
          marginLeft: 1,
        },
      }
    )
  },
  redLink: {
    ...(visitedLinksHaveFilledInCircle() ? {
      color: `${theme.palette.error.main} !important`,
      '&:after': {
        border: `1.2px solid ${theme.palette.error.main}`,
      },
      '&:visited:after, &.visited:after': {
        border: `1.2px solid ${theme.palette.error.main}`,
      },
    } : {})
  },

  owidIframe: {
    width: 600,
    height: 375,
    border: "none",
    maxWidth: "100vw",
  },
  owidBackground: {},
  metaculusIframe: {
    width: 400,
    height: 250,
    border: "none",
    maxWidth: "100vw"
  },
  metaculusBackground: {
    backgroundColor: theme.palette.panelBackground.metaculusBackground,
  },
  fatebookIframe: {
    width: 560,
    height: 200,
    border: "none",
    maxWidth: "100vw",
    backgroundColor: theme.palette.panelBackground.default,
    borderRadius: 3,
    boxShadow: theme.palette.boxShadow.eaCard,
  },
  manifoldIframe: {
    width: 560,
    height: 405,
    border: "none",
    maxWidth: "100vw",
  },
  neuronpediaIframe: {
    width: "100%",
    height: 360,
    border: "1px solid",
    borderColor: theme.palette.grey[300],
    borderRadius: 6,
    maxWidth: 639,
  },
  metaforecastIframe: {
    width: 560,
    height: 405,
    border: "none",
    maxWidth: "100vw",
  },
  estimakerIframe: {
    width: 560,
    height: 405,
    border: "none",
    maxWidth: "100vw",
  },
  viewpointsIframe: {
    width: 560,
    height: 300,
    border: "none",
    maxWidth: "100vw",
  },
}));
