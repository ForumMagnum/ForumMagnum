import { Components, registerComponent } from '@/lib/vulcan-lib';
import React from 'react';
import { lightconeFundraiserPostId, lightconeFundraiserThermometerBgUrl, lightconeFundraiserThermometerGoalAmount, lightconeFundraiserThermometerGoal2Amount } from '@/lib/publicSettings';
import { Link } from '@/lib/reactRouterWrapper';
import { useFundraiserProgress } from '@/lib/lightconeFundraiser';
import classNames from 'classnames';

// Second thermometer background image:
const lightconeFundraiserThermometerBgUrl2 =
  'https://res.cloudinary.com/lesswrong-2-0/image/upload/f_auto,w_1530,h_200,c_limit/v1735085464/Fundraiser_2_wttlis.png';

interface FundraisingThermometerProps {
  onPost?: boolean;
}

const styles = (theme: ThemeType) => ({
  root: {
    '&:hover $header': {
      color: theme.palette.review.winner,
      textShadow: `0px 0px 1px ${theme.palette.review.winner}`,
      '&:after': {
        border: `1px solid ${theme.palette.review.winner}`,
      }
    }
  },

  /*
   * A fixed-aspect container for the background thermometer,
   * with a single background-image and a pair of overlay divs on top.
   */
  thermometerContainer: {
    width: '100%',
    aspectRatio: '765 / 100',
    position: 'relative',
    borderRadius: '5px',
    overflow: 'hidden',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    backgroundSize: 'cover',
    [theme.breakpoints.down('xs')]: {
      aspectRatio: '300 / 40',
    },
    '--stage1Overlay': '100',
    '--stage2Overlay': '100',
    animation: 'backgroundChange 4s ease forwards',
  },

  /*
   * Each "blur overlay" covers some portion of the container from the right to the left.
   * By adjusting "width" (and anchoring to right: 0),
   * we reveal the unblurred background from the left.
   */
  blurredOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    backdropFilter: 'blur(10px)',
    /*
     * Instead of transition, we now rely on keyframes to animate
     * from width: 100% → whatever the final blur width is.
     */
  },

  /*
   * Keyframes for the first “stage” of the fill,
   * which goes from width: 100% → width: var(--stage1Overlay)%.
   */
  blurredOverlayStage1: {
    width: '100%',
    animation: 'fillStage1 2s ease forwards',
  },
  '@keyframes fillStage1': {
    '0%': {
      width: '100%'
    },
    '100%': {
      // We multiply by 1% so that “50” → “50%”
      width: 'calc(var(--stage1Overlay) * 1%)'
    }
  },

  /*
   * Keyframes for the second fill stage,
   * which goes from 100% → var(--stage2Overlay)%, with a 2s delay after stage1 finishes.
   */
  blurredOverlayStage2: {
    width: '100%',
    animation: 'fillStage2 2s ease forwards 2s', // start 2s after stage1
    opacity: 0,
  },
  '@keyframes fillStage2': {
    '0%': {
      width: '100%',
      opacity: 1,
    },
    '40%': {
      width: '100%',
      opacity: 1,
    },
    '100%': {
      width: 'calc(var(--stage2Overlay) * 1%)',
      opacity: 1,
    }
  },

  onPost: {
    marginTop: -12,
  },

  textContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    width: '100%',
    fontFamily: theme.typography.body2.fontFamily,
    fontSize: '1.2rem',
    paddingBottom: 6,
    textShadow: `0px 0px 20px ${theme.palette.background.default}, 0px 0px 30px ${theme.palette.background.default}, 0px 0px 40px ${theme.palette.background.default}, 0px 0px 50px ${theme.palette.background.default}`,
    alignItems: 'flex-end',
    backdropFilter: 'blur(3px)',
    [theme.breakpoints.down('xs')]: {
      flexDirection: 'column',
      alignItems: 'flex-start',
    },
  },
  header: {
    fontSize: '1.6rem',
    marginTop: 0,
    marginBottom: 0,
    fontFamily: theme.typography.headerStyle.fontFamily,
    transition: 'color 0.2s ease-in-out',
  },
  headerLinkIcon: {
    '&:after': {
      content: '""',
      width: 4,
      height: 4,
      background: theme.palette.background.default,
      border: `1px solid ${theme.palette.grey[800]}`,
      display: 'inline-block',
      position: 'relative',
      marginLeft: 2,
      borderRadius: '50%',
      top: -7
    }
  },
  hideHeaderOnMobile: {
    [theme.breakpoints.down('xs')]: {
      display: 'none',
    }
  },
  goalTextBold: {
    fontWeight: 'bold',
    fontFamily: theme.typography.headerStyle.fontFamily,
    marginRight: 6,
  },
  raisedGoalNumber: {
    color: theme.palette.review.winner,
  },

  fundraiserHeader: {
    display: 'flex',
    justifyContent: 'flex-end',
    alignItems: 'center',
    color: theme.palette.background.pageActiveAreaBackground,
    zIndex: 10,
    position: 'relative',
    width: '100%',
    height: '100%',
    padding: '0 24px',
    pointerEvents: 'auto', // keep this above the blur to allow clicking
  },
  fundraiserDonateText: {
    '&:hover': {
      textDecoration: 'none',
      opacity: 'unset'
    },
  },
  fundraiserHeaderDonateButton: {
    padding: '10px 20px',
    borderRadius: '5px',
    marginRight: '3px',
    fontSize: '1.6rem',
    fontWeight: 'bold',
    fontFamily: theme.typography.headerStyle.fontFamily,
    color: theme.palette.text.alwaysWhite,
    textShadow: `1px 1px 15px ${theme.palette.text.alwaysBlack}`,
    transition: 'background 0.2s ease-in-out, color 0.2s ease-in-out',
    '&:hover': {
      background: `${theme.palette.inverseGreyAlpha(0.8)} !important`,
      boxShadow: `0px 0px 10px ${theme.palette.inverseGreyAlpha(0.5)}`,
      color: theme.palette.text.alwaysWhite,
    },
    [theme.breakpoints.down('xs')]: {
      color: theme.palette.text.alwaysWhite,
    },
  },

  // Add new sliding background elements
  backgroundSlider: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '200%',
    height: '100%',
    display: 'flex'
  },

  backgroundSliderAnimation: {
    animation: 'slideBackgrounds 4s ease forwards',
  },
  
  backgroundImage: {
    width: '50%', // each image takes up half of the slider
    height: '100%',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    backgroundSize: 'cover',
  },

  '@keyframes slideBackgrounds': {
    '0%, 49.9%': {
      left: '0',
    },
    '50%': {
      left: '0%',
    },
    '69.9%': {
      left: '-100%',
    },
    '70%, 100%': {
      left: '-100%',
    }
  },
});

const FundraisingThermometer: React.FC<
  FundraisingThermometerProps & { classes: ClassesType }
> = ({ classes, onPost = false }) => {
  // First & second goal amounts
  const goal1 = lightconeFundraiserThermometerGoalAmount.get();
  const goal2 = lightconeFundraiserThermometerGoal2Amount.get();

  // Use the main fundraiser progress hook for the overall amount
  const [percentage, currentAmount] = useFundraiserProgress(goal2);

  // Two-stage fraction calculations:
  const finalPct1 = Math.min((currentAmount / goal1) * 100, 100);
  const finalPct2 =
    currentAmount > goal1
      ? Math.min(((currentAmount - goal1) / (goal2 - goal1)) * 100, 100)
      : 0;

  // Decide which background image to use (stage1 or stage2):
  const isStage2 = currentAmount > goal1;

  /*
   * Overlays: we previously used transition: 'width 2s ease'.
   * Now we rely on CSS keyframes. We pass the final “blur widths”
   * as CSS variables, so the @keyframes can animate from 100% → var(--stageXOverlay)%.
   *
   * The overlay covers some fraction from the right. So if finalPct=30,
   * that means we want to unblur 30% on the left, i.e. the overlay is 70%.
   */
  const stage1Width = 100 - finalPct1;
  const stage2Width = 100 - finalPct2;

  const displayGoal = currentAmount < goal1 ? goal1 : goal2;
  const displayedStageNumber = currentAmount < goal1 ? 1 : 2;

  const { LWTooltip } = Components;

  return (
    <div className={classNames(classes.root, onPost && classes.onPost)}>
      <div className={classes.textContainer}>
        {onPost ? (
          <span
            className={classNames(classes.header, {
              [classes.hideHeaderOnMobile]: onPost
            })}
          >
            Fundraiser Progress
          </span>
        ) : (
          <LWTooltip title="12,000 words about why you should give us money" placement="top-start">
            <Link
              className={classNames(classes.header, classes.headerLinkIcon)}
              to={`/posts/${lightconeFundraiserPostId.get()}`}
            >
              Lightcone Infrastructure Fundraiser
            </Link>
          </LWTooltip>
        )}
        <span>
          <span className={classes.goalTextBold}>Goal {displayedStageNumber}:</span>
          <span className={classes.raisedGoalNumber}>
            ${Math.round(currentAmount).toLocaleString()}
          </span>{" "}
          of ${displayGoal.toLocaleString()}
        </span>
      </div>

      <div
        className={classes.thermometerContainer}
        style={{
          ['--stage1Overlay' as any]: stage1Width,
          ['--stage2Overlay' as any]: stage2Width,
        }}
      >
        {/* Add sliding background container */}
        <div className={classNames(classes.backgroundSlider, isStage2 && classes.backgroundSliderAnimation)}>
          <div 
            className={classes.backgroundImage} 
            style={{ backgroundImage: `url(${lightconeFundraiserThermometerBgUrl.get()})` }}
          />
          <div 
            className={classes.backgroundImage} 
            style={{ backgroundImage: `url(${lightconeFundraiserThermometerBgUrl2})` }}
          />
        </div>

        {/* Fundraiser header with Donate button */}
        <div className={classes.fundraiserHeader}>
          <Link className={classes.fundraiserDonateText} to="https://lightconeinfrastructure.com/donate">
            <div className={classes.fundraiserHeaderDonateButton}>Donate</div>
          </Link>
        </div>

        {/* Stage 1 blur overlay */}
        {finalPct1 > 0 && (
          <div className={classNames(classes.blurredOverlay, classes.blurredOverlayStage1)} />
        )}

        {/* Stage 2 blur overlay */}
        {finalPct2 > 0 && (
          <div className={classNames(classes.blurredOverlay, classes.blurredOverlayStage2)} />
        )}
      </div>
    </div>
  );
};

const FundraisingThermometerComponent = registerComponent(
  'FundraisingThermometer',
  FundraisingThermometer,
  { styles }
);

export default FundraisingThermometerComponent;

declare global {
  interface ComponentTypes {
    FundraisingThermometer: typeof FundraisingThermometerComponent;
  }
}
