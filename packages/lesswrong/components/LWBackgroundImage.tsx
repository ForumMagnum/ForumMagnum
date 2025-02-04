import React from 'react';
import { Components, registerComponent } from '../lib/vulcan-lib';
import { useLocation } from '../lib/routeUtil';
import { getReviewPhase } from '../lib/reviewUtils';
import { defineStyles, useStyles } from './hooks/useStyles';

const styles = defineStyles("LWBackgroundImage", (theme: ThemeType) => ({
  root: {
    position: 'absolute',
    right: 0,
  },
  backgroundImage: {
    position: 'absolute',
    width: '57vw',
    maxWidth: '1000px',
    top: '-57px',
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
    ['@media(max-width: 1000px)']: {
      display: 'none'
    },
  },
  reviewVotingCanvas: {
    position: 'absolute',
    width: '57vw',
    height: '100vh',
    '& img': {
      width: '100%',
      height: '100vh',
      position: 'relative',
      right: -40,
      objectFit: 'cover',
    },
    maxWidth: '1000px',
    top: '-57px',
    right: '-334px',
    '-webkit-mask-image': `radial-gradient(ellipse at center top, ${theme.palette.text.alwaysBlack} 55%, transparent 70%)`,
    
    [theme.breakpoints.up(2000)]: {
      right: '0px',
    }
  },
  // from LessOnline
  // bannerText: {
  //   ...theme.typography.postStyle,
  //   ['@media(max-width: 1375px)']: {
  //     width: 250
  //   },
  //   ['@media(max-width: 1325px)']: {
  //     width: 200
  //   },
  //   ['@media(max-width: 1200px)']: {
  //     display: "none"
  //   },
  //   position: 'absolute',
  //   right: 16,
  //   bottom: 79,
  //   color: theme.palette.grey[900],
  //   display: "flex",
  //   flexDirection: "column",
  //   alignItems: "flex-end",
  //   textAlign: "right",
  //   width: 300,
  //   '& h2': {
  //     fontSize: '2.4rem',
  //     lineHeight: '2.6rem',
  //     marginTop: 20,
  //     marginBottom: 0,
  //     textShadow: `
  //       0 0 15px ${theme.palette.background.pageActiveAreaBackground}, 
  //       0 0 15px ${theme.palette.background.pageActiveAreaBackground}, 
  //       0 0 15px ${theme.palette.background.pageActiveAreaBackground}, 
  //       0 0 15px ${theme.palette.background.pageActiveAreaBackground}
  //     `,
  //     '& a:hover': {
  //       opacity: 1
  //     }
  //   },
  //   '& h3': {
  //     fontSize: '20px',
  //     margin: 0,
  //     lineHeight: '1.2',
  //     marginBottom: 6,
  //     textShadow: `
  //       0 0 15px ${theme.palette.background.pageActiveAreaBackground}, 
  //       0 0 15px ${theme.palette.background.pageActiveAreaBackground}, 
  //       0 0 15px ${theme.palette.background.pageActiveAreaBackground}, 
  //       0 0 15px ${theme.palette.background.pageActiveAreaBackground}
  //     `,
  //   },
  //   '& button': {
  //     ...theme.typography.commentStyle,
  //     backgroundColor: theme.palette.primary.main,
  //     opacity: .9,
  //     border: 'none',
  //     color: theme.palette.text.alwaysWhite,
  //     fontWeight: 600,
  //     borderRadius: '3px',
  //     textAlign: 'center',
  //     padding: 8,
  //     fontSize: '14px',
  //     marginTop: 6
  //   },
  //   '& p': {
  //     ...commentBodyStyles(theme),
  //     fontSize: '14px',
  //     marginBottom: 10,
  //   },
  //   '& p a': {
  //     color: theme.palette.primary.main,
  //   }
  // },
  // ticketPricesRaise: {
  //   ...theme.typography.commentStyle,
  //   fontStyle: 'italic',
  //   fontSize: 14,
  //   marginTop: 10,
  //   '& p': {
  //     margin: 4
  //   }
  // },
  // lessOnlineBannerDateAndLocation: {
  //   ...theme.typography.commentStyle,
  //   fontSize: '16px !important',
  //   fontStyle: 'normal',
  //   marginBottom: '16px !important',
  // },
}));

export const LWBackgroundImage = ({standaloneNavigation}: {
  standaloneNavigation: boolean,
}) => {
  const classes = useStyles(styles);
  const { ReviewVotingCanvas, CloudinaryImage2 } = Components
  const { currentRoute } = useLocation();

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

  return <div className={classes.root}>
      {getReviewPhase() === 'VOTING' && currentRoute?.name === 'home' && <ReviewVotingCanvas />}
      {getReviewPhase() === 'VOTING' && currentRoute?.name !== 'home' && defaultImage}
      {getReviewPhase() !== 'VOTING' && defaultImage}
  </div>;
}

const LWBackgroundImageComponent = registerComponent('LWBackgroundImage', LWBackgroundImage);

declare global {
  interface ComponentTypes {
    LWBackgroundImage: typeof LWBackgroundImageComponent
  }
}
