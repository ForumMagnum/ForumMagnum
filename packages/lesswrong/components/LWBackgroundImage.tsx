import React from 'react';
import { registerComponent } from '../lib/vulcan-lib/components';
import { useSubscribedLocation } from '../lib/routeUtil';
import { getReviewPhase, reviewResultsPostPath } from '../lib/reviewUtils';
import { defineStyles, useStyles } from './hooks/useStyles';
import { Link } from '../lib/reactRouterWrapper';
import ReviewVotingCanvas from "./review/ReviewVotingCanvas";
import CloudinaryImage2 from "./common/CloudinaryImage2";

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
  reviewResultsImage: {
    position: 'absolute',
    width: '57vw',
    maxWidth: '1000px',
    top: '-70px',
    right: '-334px',
    '-webkit-mask-image': `radial-gradient(ellipse at center top, ${theme.palette.text.alwaysBlack} 55%, transparent 70%)`,
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
  votingResultsLink: {
    position: 'relative',
    zIndex: theme.zIndexes.reviewVotingCanvas,
    top: 715,
    right: 250,
    width: 200,
    opacity: .6,
    textAlign: 'center',
    display: 'block',
    '&:hover': {
      opacity: .4,
    },
    [theme.breakpoints.down(1600)]: {
      right: 100,
      top: 690
    },
    [theme.breakpoints.down(1400)]: {
      right: 35,
      top: 650
    },
    '& h1': {
      ...theme.typography.headerStyle,
      fontSize: '2.8rem',
      lineHeight: '2.6rem',
      fontWeight: 600,
      marginTop: 20,
      marginBottom: 0,
    },
    '& h3': {
      ...theme.typography.commentStyle,
      fontSize: '1.4rem',
      lineHeight: '1.2',
      marginTop: 16,
      marginBottom: 6,
      fontStyle: 'italic',
      opacity: .5,
    }
  }
}));

export const LWBackgroundImage = ({standaloneNavigation}: {
  standaloneNavigation: boolean,
}) => {
  const classes = useStyles(styles);
  const { currentRoute } = useSubscribedLocation();

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

  const reviewCompleteImage = <div>
      <Link className={classes.votingResultsLink} to={reviewResultsPostPath}>
        <h1>Thank YOU for Voting!</h1>
        <h3>View Results</h3>
      </Link>
      <CloudinaryImage2
        loading="lazy"
        className={classes.reviewResultsImage}
        publicId="happyWizard_mmmnjx"
        darkPublicId={"happyWizard_mmmnjx"}
      />
  </div>

  let homePageImage = defaultImage
  if (getReviewPhase() === 'VOTING') homePageImage = <ReviewVotingCanvas />
  if (getReviewPhase() === 'RESULTS') homePageImage = reviewCompleteImage

  return <div className={classes.root}>
    {currentRoute?.name === 'home' ? homePageImage : defaultImage}
  </div>;
}

export default registerComponent('LWBackgroundImage', LWBackgroundImage, {
  areEqual: "auto",
});


