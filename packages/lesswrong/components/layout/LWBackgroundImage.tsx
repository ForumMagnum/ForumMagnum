import React from 'react';
import { registerComponent } from '@/lib/vulcan-lib/components';
import { useSubscribedLocation } from '@/lib/routeUtil';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import CloudinaryImage2 from "@/components/common/CloudinaryImage2";
import { isHomeRoute } from '@/lib/routeChecks';
import { useCookiesWithConsent } from '../hooks/useCookiesWithConsent';
import { HIDE_SOLSTICE_GLOBE_COOKIE } from '@/lib/cookies/cookies';
import { SolsticeSeasonBanner } from '../seasonal/solsticeSeason/SolsticeSeasonBanner';
import withErrorBoundary from '@/components/common/withErrorBoundary';

const styles = defineStyles("LWBackgroundImage", (theme: ThemeType) => ({
  root: {
    position: 'absolute',
    top: 0,
    right: 0,
  },
  backgroundImage: {
    position: 'absolute',
    width: '57vw',
    maxWidth: '1000px',
    top: '-70px',
    right: '-334px',
    '-webkit-mask-image': `radial-gradient(ellipse at center top, ${theme.palette.text.alwaysBlack} 55%, transparent 70%)`,
    
    [theme.breakpoints.up(2000)]: {
      right: '0px',
    }
  },
  imageColumn: {
    position: 'absolute',
    top: 0,
    right: 0,
    height: "100vh",
    width: '57vw',
    [theme.breakpoints.down('sm')]: {
      display: 'none'
    },
  },
  showSolsticeButton: {
    position: 'fixed',
    bottom: 12,
    right: '12vw',
    zIndex: 10,
    ...theme.typography.commentStyle,
    background: "transparent",
    border: 'none',
    borderRadius: 3,
    fontSize: 14,
    fontWeight: 400,
    cursor: 'pointer',
    padding: '8px 16px',
    opacity: 0.5,
    transition: 'opacity 0.2s ease-out',
    '&:hover': {
      opacity: 1,
    },
    [theme.breakpoints.down(1425)]: {
      display: 'none',
    },
  }
}));

export const LWBackgroundImage = ({standaloneNavigation}: {
  standaloneNavigation: boolean,
}) => {
  const classes = useStyles(styles);
  // TODO: figure out if using usePathname directly is safe or better (concerns about unnecessary rerendering, idk; my guess is that with Next if the pathname changes we're rerendering everything anyways?)
  const { pathname } = useSubscribedLocation();
  // const pathname = usePathname();
  const isHomePage = isHomeRoute(pathname);

  const [cookies, setCookie] = useCookiesWithConsent([HIDE_SOLSTICE_GLOBE_COOKIE]);
  const hideGlobeCookie = cookies[HIDE_SOLSTICE_GLOBE_COOKIE] === "true";

  const defaultImage = standaloneNavigation ? <div className={classes.imageColumn}> 
    {/* Background image shown in the top-right corner of LW. The
    * loading="lazy" prevents downloading the image if the
    * screen-size is such that the image will be hidden by a
    * breakpoint. */}
    <CloudinaryImage2
      loading="lazy"
      className={classes.backgroundImage}
      publicId="ohabryka_Topographic_aquarelle_book_cover_by_Thomas_W._Schaller_f9c9dbbe-4880-4f12-8ebb-b8f0b900abc1_m4k6dy_734413"
      darkPublicId={"ohabryka_Topographic_aquarelle_book_cover_by_Thomas_W._Schaller_f9c9dbbe-4880-4f12-8ebb-b8f0b900abc1_m4k6dy_734413_copy_lnopmw"}
    />
  </div> : null

  let homePageImage = (standaloneNavigation && isHomePage && !hideGlobeCookie) ? <SolsticeSeasonBanner /> : defaultImage
  // if (reviewIsActive() && standaloneNavigation && isHomePage) {
  //   homePageImage = <AnnualReviewSidebarBanner />
  // }

  const showSolsticeButton = standaloneNavigation && isHomePage && hideGlobeCookie

  return <div className={classes.root}>
    {homePageImage}
    {showSolsticeButton && (
      <button
        className={classes.showSolsticeButton}
        onClick={() => setCookie(HIDE_SOLSTICE_GLOBE_COOKIE, "false")}
      >
        Show Solstice Season
      </button>
    )}
  </div>;
}

export default registerComponent('LWBackgroundImage', LWBackgroundImage, {
  areEqual: "auto",
  hocs: [withErrorBoundary],
});


