import { Components, registerComponent } from '@/lib/vulcan-lib';
import React, { useEffect, useState } from 'react';
import { lightconeFundraiserPostId, lightconeFundraiserThermometerBgUrl } from '@/lib/publicSettings';
import { Link } from '@/lib/reactRouterWrapper';
import { useFundraiserProgress } from '@/lib/lightconeFundraiser';

interface FundraisingThermometerProps {
  goalAmount: number;
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
  thermometer: {
    width: '100%',
    aspectRatio: '765 / 100',
    borderRadius: '5px',
    position: 'relative',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    '&:hover $fundraiserHeaderDonateButton': {
      background: theme.palette.inverseGreyAlpha(0.25),
      color: theme.palette.text.alwaysWhite,
    },
  },
  fill: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: '100%',
    backgroundImage: `url(${lightconeFundraiserThermometerBgUrl.get()})`,
    boxShadow: `inset -5px 0px 10px ${theme.palette.fundraisingThermometer.shadow}`,
  },
  blurredUnfill: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundImage: `url(${lightconeFundraiserThermometerBgUrl.get()})`,
    backgroundSize: '765px',
    backgroundPosition: 'left',
    filter: 'blur(10px)',
    transform: 'scale(1.05)', // Slight scale to compensate for blur
    transition: 'filter 0.5s ease-in-out',
  },
  header: {
    fontSize: '1.6rem',  
    marginTop: 0,
    marginBottom: 0,
    fontFamily: theme.typography.headerStyle.fontFamily,
    transition: 'color 0.2s ease-in-out',
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
  subheader: {
    color: theme.palette.review.winner,
    fontSize: '1.2rem',
    fontFamily: theme.typography.headerStyle.fontFamily,
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
    }
  },
  raisedTextBold: {
    fontWeight: 'bold',
    fontFamily: theme.typography.headerStyle.fontFamily,
  },
  goalTextBold: {
    fontWeight: 'bold',
    fontFamily: theme.typography.headerStyle.fontFamily,
    marginRight: 6
  },
  raisedGoalNumber: {
    color: theme.palette.review.winner,
  },
  fundraiserHeader: {
    display: 'flex',
    justifyContent: 'flex-end',
    alignItems: 'center',
    color: theme.palette.background.pageActiveAreaBackground,
    zIndex: 1,
    position: 'relative',
    width: '100%',
    height: '100%',
    padding: '0 24px',
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
    color: theme.palette.grey[500],
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
  learnMoreContainer: {
    width: '100%',
    display: 'flex',
    justifyContent: 'flex-end',
    marginTop: 12,
    paddingBottom: 24,
  },
});

const FundraisingThermometer: React.FC<FundraisingThermometerProps & {classes: ClassesType}> = ({ goalAmount, classes }) => {
  const [percentage, currentAmount] = useFundraiserProgress(goalAmount);
  const [viewPercentage, setViewPercentage] = useState(percentage);
  const [viewCurrentAmount, setViewCurrentAmount] = useState(currentAmount);
  useEffect(() => {
    const startTime = Date.now();
    let interval = setInterval(() => {
      const elapsedTime = Date.now() - startTime;
      setViewPercentage(viewP => viewP < percentage ? Math.min(viewP + (1 * elapsedTime / 1000), percentage) : percentage);
      setViewCurrentAmount(viewCA => viewCA < currentAmount ? Math.min(viewCA + (10000 * elapsedTime / 1000), currentAmount) : currentAmount);
    }, 1);
    return () => clearInterval(interval);
  }, [percentage, currentAmount])

  const { LWTooltip } = Components

  return (
    <div className={classes.root}>
      <div className={classes.textContainer}>
        <LWTooltip title="12,000 words about why you should give us money" placement="top-start">
          <Link className={classes.header} to={`/posts/${lightconeFundraiserPostId.get()}`}>
            Lightcone Infrastructure Fundraiser
          </Link>
        </LWTooltip>
        <span className={classes.goalText}>
          <span className={classes.goalTextBold}>Goal 1:</span> 
          <span className={classes.raisedGoalNumber}>${Math.round(viewCurrentAmount).toLocaleString()}</span> of ${goalAmount.toLocaleString()}
        </span>
      </div>
      <div className={classes.thermometer}>
        <div className={classes.fundraiserHeader}>
          <Link className={classes.fundraiserDonateText} to="https://lightconeinfrastructure.com/donate">
            <div className={classes.fundraiserHeaderDonateButton}>
              Donate
            </div>
          </Link>
        </div>
        <div className={classes.blurredUnfill}></div>
        <div className={classes.fill} style={{width: `${viewPercentage}%`, backgroundSize: `${100*100/viewPercentage}% auto`}}></div>
      </div>
    </div>
  );
};

const FundraisingThermometerComponent = registerComponent('FundraisingThermometer', FundraisingThermometer, {styles});

export default FundraisingThermometerComponent;

declare global {
  interface ComponentTypes {
    FundraisingThermometer: typeof FundraisingThermometerComponent
  }
}
