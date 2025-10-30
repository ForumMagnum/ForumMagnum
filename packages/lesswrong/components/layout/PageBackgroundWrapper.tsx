import React, { useEffect } from 'react';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import { isAF, isLWorAF } from '@/lib/instanceSettings';
import classNames from 'classnames';
import { isFullscreenRoute } from '@/lib/routeChecks';
import { usePrerenderablePathname } from '../next/usePrerenderablePathname';
import { routeHasWhiteBackground } from './routeBackgroundColors';
import { THEME_COOKIE } from '@/lib/cookies/cookies';

const styles = defineStyles("PageBackgroundWrapper", (theme: ThemeType) => ({
  wrapper: {
    position: 'relative',
    overflowX: 'clip'
  },
  fullscreen: {
    // The min height of 600px here is so that the page doesn't shrink down completely when the keyboard is open on mobile.
    // I chose 600 as being a bit smaller than the smallest phone screen size, although it's hard to find a good reference
    // for this. Here is one site with a good list from 2018: https://mediag.com/blog/popular-screen-resolutions-designing-for-all/
    height: "max(100vh, 600px)",
    display: "flex",
    flexDirection: "column",
  },
  whiteBackground: {
    background: theme.palette.background.pageActiveAreaBackground,
  },
}))

function PageBackgroundWrapper({children}: {
  children: React.ReactNode
}) {
  const classes = useStyles(styles);
  const pathname = usePrerenderablePathname();

  // Some pages (eg post pages) have a solid white background, others (eg front page) have a gray
  // background against which individual elements in the central column provide their own
  // background. (In dark mode this is black and dark gray instead of white and light gray). This
  // is handled by putting `classes.whiteBackground` onto the main wrapper.
  //
  // But, caveat/hack: If the page has horizontal scrolling and the horizontal scrolling is the
  // result of a floating window, the page wrapper doesn't extend far enough to the right. So we
  // also have a `useEffect` which adds a class to `<body>`. (This has to be a useEffect because
  // <body> is outside the React tree entirely. An alternative way to do this would be to change
  // overflow properties so that `<body>` isn't scrollable but a `<div>` in here is.)
  const useWhiteBackground = routeHasWhiteBackground(pathname);

  useEffect(() => {
    const isWhite = document.body.classList.contains(classes.whiteBackground);
    if (isWhite !== useWhiteBackground) {
      if (useWhiteBackground) {
        document.body.classList.add(classes.whiteBackground);
      } else {
        document.body.classList.remove(classes.whiteBackground);
      }
    }
  }, [useWhiteBackground, classes.whiteBackground]);


  return <div id="wrapper" className={classNames(
    "wrapper", {
      'alignment-forum': isAF(),
      [classes.fullscreen]: isFullscreenRoute(pathname),
      [classes.wrapper]: isLWorAF(),
      [classes.whiteBackground]: useWhiteBackground,
    },
  )}>
    {children}
  </div>
}

export function BodyWithBackgroundColor({children}: {
  children: React.ReactNode
}) {
  const pathname = usePrerenderablePathname();
  const isWhiteBackground = routeHasWhiteBackground(pathname);
  
  // TODO: Also inject a script that reads the theme cookie and sets the color-scheme on the body element
  // TODO: Swtich over from PageBackgroundWrapper to this
  
  return <body className={classNames(
    isWhiteBackground && "whiteBackground",
    !isWhiteBackground && "greyBackground"
  )}>
    <style>{`
      @media (prefers-color-schema: light) {
        body.whiteBackground {
          background: white;
        }
        body.greyBackground {
          background: #f8f4ee;
        }
      }
      @media (prefers-color-schema: dark) {
        body.whiteBackground {
          background: black;
        }
        body.greyBackground {
          background: #262626;
        }
      }
    `}</style>
    {children}
  </body>
}


export default PageBackgroundWrapper;

