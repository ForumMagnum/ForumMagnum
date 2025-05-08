import { Components, registerComponent } from '@/lib/vulcan-lib/components.tsx';
import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { lightconeFundraiserPostId, lightconeFundraiserThermometerBgUrl, lightconeFundraiserThermometerGoalAmount, lightconeFundraiserThermometerGoal2Amount, lightconeFundraiserThermometerGoal3Amount } from '@/lib/publicSettings';
import { Link } from '@/lib/reactRouterWrapper';
import { useFundraiserProgress } from '@/lib/lightconeFundraiser';
import classNames from 'classnames';
import { useCurrentTime } from '@/lib/utils/timeUtil';
import DeferRender from './DeferRender';
import { isClient } from '@/lib/executionEnvironment';
import Confetti from 'react-confetti';

// Second thermometer background image:
const lightconeFundraiserThermometerBgUrl2 =
  'https://res.cloudinary.com/lesswrong-2-0/image/upload/f_auto,w_1530,h_200,c_limit/v1735085464/Fundraiser_2_wttlis.png';

// Third thermometer background image:
const lightconeFundraiserThermometerBgUrl3 =
  'https://res.cloudinary.com/lesswrong-2-0/image/upload/f_auto,w_1530,h_200,c_limit/v1736822993/wgfexpdeikepryhu1und_uz6lap.png';

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
    '--stage3Overlay': '100',
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
    animation: 'fillStage1 1.3s ease forwards',
  },
  '@keyframes fillStage1': {
    '0%': {
      width: '100%'
    },
    '40%': {
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
    animation: 'fillStage2 1.3s ease forwards 1.3s', // start 1.3s after stage1
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

  blurredOverlayStage3: {
    width: '100%',
    animation: 'fillStage3 1.3s ease forwards 2.6s', // start 2.6s after stage1
    opacity: 0,
  },
  '@keyframes fillStage3': {
    '0%': {
      width: '100%',
      opacity: 1,
    },
    '40%': {
      width: '100%',
      opacity: 1,
    },
    '100%': {
      width: 'calc(var(--stage3Overlay) * 1%)',
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
    textAlign: 'center',
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

  fundraiserHeaderRemainingDays: {
    fontSize: '0.8rem',
    fontFamily: theme.typography.commentStyle.fontFamily,
    color: theme.palette.text.alwaysWhite,
  },

  // Add new sliding background elements
  backgroundSlider: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '300%',
    height: '100%',
    display: 'flex',
  },

  backgroundSliderAnimation: {
    animation: 'slideBackgrounds 3.9s ease forwards',
  },
  
  backgroundImage: {
    // each segment is one-third of the slider
    width: '33.333%',
    height: '100%',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    backgroundSize: 'cover',
  },

  '@keyframes slideBackgrounds': {
    '0%': {
      left: '0',
    },
    '33%': {
      left: '0',
    },
    '40%': {
      left: '-100%',
    },
    '66%': {
      left: '-100%',
    },
    '72%': {
      left: '-200%',
    },
    '100%': {
      left: '-200%',
    }
  },

  countdownOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    background: theme.palette.text.alwaysBlack,
    zIndex: 9999,
    opacity: 0,
    visibility: 'hidden',
    transition: 'opacity 1s ease-in-out, visibility 1s ease-in-out',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    color: theme.palette.text.alwaysWhite,
    pointerEvents: 'none',
  },
  
  countdownVisible: {
    opacity: 1,
    visibility: 'visible',
  },

  countdownText: {
    fontFamily: theme.typography.headerStyle.fontFamily,
    fontSize: '4rem',
    textAlign: 'center',
    '& > div:first-child': {
      fontSize: '2.5rem',
      marginBottom: '1rem',
    },
    '& > div:last-child': {
      fontSize: '3rem',
      color: theme.palette.error.main,
    }
  },
});

const FundraisingThermometerInner: React.FC<
  FundraisingThermometerProps & { classes: ClassesType<typeof styles> }
> = ({ classes, onPost = false }) => {
  // First, second, and third goal amounts
  const goal1 = lightconeFundraiserThermometerGoalAmount.get();
  const goal2 = lightconeFundraiserThermometerGoal2Amount.get();
  const goal3 = lightconeFundraiserThermometerGoal3Amount.get();

  // Use the main fundraiser progress hook for the overall amount
  const [percentage, currentAmount] = useFundraiserProgress(goal3);

  // Fraction calculations for 3 stages
  const finalPct1 = Math.min((currentAmount / goal1) * 100, 100);
  const finalPct2 =
    currentAmount > goal1
      ? Math.min(((currentAmount - goal1) / (goal2 - goal1)) * 100, 100)
      : 0;
  const finalPct3 =
    currentAmount > goal2
      ? Math.min(((currentAmount - goal2) / (goal3 - goal2)) * 100, 100)
      : 0;

  const displayGoal = currentAmount < goal1 ? goal1 : currentAmount < goal2 ? goal2 : goal3;
  const displayedStageNumber = currentAmount < goal1 ? 1 : currentAmount < goal2 ? 2 : 3;

  // End at 23:59 AoE (UTC-12) on Jan 13th
  const fundraiserEndDate = new Date('2025-01-14T11:59:00Z');
  const currentTime = useCurrentTime();
  const timeRemainingMs = fundraiserEndDate.getTime() - currentTime.getTime();
  const fundraiserEnded = timeRemainingMs <= 0;

  // Display days/hours if not ended
  const remainingDays = Math.ceil(timeRemainingMs / (1000 * 60 * 60 * 24));
  const remainingHours = Math.ceil(timeRemainingMs / (1000 * 60 * 60));
  const timeRemainingText = remainingHours <= 72 
    ? `${remainingHours} hours remaining`
    : `${remainingDays} days remaining`;

  const { LWTooltip } = Components;

  // State for final push countdown and—for after the fundraiser—confetti
  const [showCountdown, setShowCountdown] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  let hoverTimer: ReturnType<typeof setTimeout>;

  const handleMouseEnter = () => {
    if (fundraiserEnded) {
      // Show confetti if hovered while fundraiser is over
      setShowConfetti(true);
      return;
    }
    // If not ended, show the final push countdown if < 72h remain
    if (remainingHours <= 72) {
      hoverTimer = setTimeout(() => {
        setShowCountdown(true);
      }, 2000);
    }
  };

  const handleMouseLeave = () => {
    clearTimeout(hoverTimer);
    setShowCountdown(false);
    setShowConfetti(false);
  };

  // Stage overlay widths: blur covers `(100 - finalPctX)%` from the right
  const stage1Width = 100 - finalPct1;
  const stage2Width = 100 - finalPct2;
  const stage3Width = 100 - finalPct3;

  return (
    <>
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
            {/* If fundraiser ended, show 'Total raised'; otherwise still show 'Goal' */}
            <span className={classes.goalTextBold}>
              {fundraiserEnded ? 'Total raised:' : `Goal ${displayedStageNumber}:`}
            </span>
            <span className={classes.raisedGoalNumber}>
              ${Math.round(currentAmount).toLocaleString()}
            </span>{" "}
            {!fundraiserEnded && `of ${displayGoal.toLocaleString()}`}
          </span>
        </div>

        <div
          className={classes.thermometerContainer}
          style={{
            ['--stage1Overlay' as any]: stage1Width,
            ['--stage2Overlay' as any]: stage2Width,
            ['--stage3Overlay' as any]: stage3Width,
          }}
        >
          <div className={classNames(classes.backgroundSlider, currentAmount > goal1 && classes.backgroundSliderAnimation)}>
            <div
              className={classes.backgroundImage}
              style={{ backgroundImage: `url(${lightconeFundraiserThermometerBgUrl.get()})` }}
            />
            <div
              className={classes.backgroundImage}
              style={{ backgroundImage: `url(${lightconeFundraiserThermometerBgUrl2})` }}
            />
            <div
              className={classes.backgroundImage}
              style={{ backgroundImage: `url(${lightconeFundraiserThermometerBgUrl3})` }}
            />
          </div>

          {/* Fundraiser header with a button (either "Donate" or "Fundraiser over") */}
          <div className={classes.fundraiserHeader}>
            <Link
              className={classes.fundraiserDonateText}
              to={'https://lightconeinfrastructure.com/donate'}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              <div className={classes.fundraiserHeaderDonateButton}>
                {fundraiserEnded ? 'Fundraiser over' : 'Donate'}
                <div className={classes.fundraiserHeaderRemainingDays}>{fundraiserEnded ? '(You can still donate though)' : timeRemainingText}</div>
              </div>
            </Link>
          </div>

          {/* Stage 1 overlay */}
          {finalPct1 > 0 && (
            <div className={classNames(classes.blurredOverlay, classes.blurredOverlayStage1)} />
          )}

          {/* Stage 2 overlay */}
          {finalPct2 > 0 && (
            <div className={classNames(classes.blurredOverlay, classes.blurredOverlayStage2)} />
          )}

          {/* Stage 3 overlay */}
          {finalPct3 > 0 && (
            <div className={classNames(classes.blurredOverlay, classes.blurredOverlayStage3)} />
          )}
        </div>
      </div>

      <DeferRender ssr={false}>
        {isClient && !fundraiserEnded && ReactDOM.createPortal(
          <div className={classNames(classes.countdownOverlay, showCountdown && classes.countdownVisible)}>
            <div className={classes.countdownText}>
              <div>Dawn of</div>
              <div>The Final Push</div>
              <div>-{remainingHours} Hours Remain-</div>
            </div>
          </div>,
          document.body
        )}
      </DeferRender>

      {/* If the fundraiser is over and user hovers, show confetti */}
      {isClient && fundraiserEnded && showConfetti && (
        <Confetti
          style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%' }}
          numberOfPieces={250}
          gravity={0.25}
        />
      )}
    </>
  );
};

export const FundraisingThermometer = registerComponent(
  'FundraisingThermometer',
  FundraisingThermometerInner,
  { styles }
);



declare global {
  interface ComponentTypes {
    FundraisingThermometer: typeof FundraisingThermometer;
  }
}
