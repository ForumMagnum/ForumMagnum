import { visitedLinksHaveFilledInCircle } from '@/lib/betas';
import { defineStyles, useStyles } from '../hooks/useStyles';

const LINK_INDICATOR_CIRCLE_DIAMETER = 4;
const LINK_INDICATOR_CIRCLE_DISTANCE_FROM_WORD = 2;

export const linkStyles = defineStyles("LinkStyles", (theme: ThemeType) => ({
  link: {
    // Reserve space for the link-circle. This can't reserve its own space with
    // a span, because it would be wrapped onto the next line if it's at the
    // right side; we use padding and a zero-width element so that, if the last
    // word and the link-circle both get pushed onto the next line together.
    paddingRight: LINK_INDICATOR_CIRCLE_DIAMETER + LINK_INDICATOR_CIRCLE_DISTANCE_FROM_WORD,
  },
  visitedIndicator: {
    position: "relative",
    right: 0,
    width: 0,
    display: "inline-block",

    "&:after": {
      content: '"\u2060"',
      marginLeft: LINK_INDICATOR_CIRCLE_DISTANCE_FROM_WORD,
      position: "relative",
      top: 4,
      width: LINK_INDICATOR_CIRCLE_DIAMETER,
      height: LINK_INDICATOR_CIRCLE_DIAMETER,
      display: "inline-block",
      background: theme.palette.background.default,
      border: `1.2px solid ${theme.palette.link.color ?? theme.palette.primary.main}`,
      borderRadius: "50%",

      ...(visitedLinksHaveFilledInCircle() && {
        "a:visited &, a.visited &": {
          background: theme.palette.link.visited ?? theme.palette.primary.main,
          border: `1.2px solid ${theme.palette.link.visited ?? theme.palette.primary.main}`,
        },
      }),
    },
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

/**
 * A little circle to the right of a link, to indicate that it's a special
 * hoverable link and (if the visitedLinksHaveFilledInCircle site setting is
 * on) whether the destination of the link is visited/read. This should be a a
 * descendent of an <a> tag with the LinkStyles-link class. It will be filled
 * in (marked as visited) if either that link is :visited (ie, based on browser
 * history), or it has the "visited" class.
 */
export const VisitedIndicator = () => {
  const classes = useStyles(linkStyles);
  return <span className={classes.visitedIndicator}></span>;
}
