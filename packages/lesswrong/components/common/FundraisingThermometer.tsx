import { registerComponent } from '@/lib/vulcan-lib';
import React, { useEffect, useState } from 'react';
import { lightconeFundraiserPostId, lightconeFundraiserThermometerBgUrl, lightconeFundraiserUnsyncedAmount } from '@/lib/publicSettings';
import { Link } from '@/lib/reactRouterWrapper';
import { useFundraiserProgress } from '@/lib/lightconeFundraiser';

interface FundraisingThermometerProps {
  goalAmount: number;
}

const styles = (theme: ThemeType) => ({
  thermometer: {
    width: '100%',
    aspectRatio: '765 / 100',
    borderRadius: '5px',
    position: 'relative',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
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
    fontSize: '2rem',
    marginBottom: 0,
    fontFamily: theme.typography.headerStyle.fontFamily,
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
  },
  raisedTextBold: {
    fontWeight: 'bold',
  },
  goalTextBold: {
    fontWeight: 'bold',
  },
  raisedGoalNumber: {
    color: theme.palette.review.winner,
  },
  fundraiserHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  fundraiserHeaderDonateButton: {
    padding: '10px 20px',
    borderRadius: '5px',
    marginRight: '3px',
    fontSize: '1.6rem',
    fontWeight: 'bold',
    fontFamily: theme.typography.headerStyle.fontFamily,
    color: theme.palette.review.winner,
    background: theme.palette.inverseGreyAlpha(0.35),
    backdropFilter: 'blur(3px)',
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


  return (
    <div className={classes.fundraiserContainer}>
      <div className={classes.fundraiserHeader}>
        <div className={classes.fundraiserHeaderText}>
          <h2 className={classes.header}><Link to={`/posts/${lightconeFundraiserPostId.get()}`}>Lightcone Infrastructure fundraiser progress</Link></h2>
          <h3 className={classes.subheader}>Goal 1: May</h3>
        </div>
        <Link className={classes.fundraiserDonateText} to="https://lightconeinfrastructure.com/donate">
          <div className={classes.fundraiserHeaderDonateButton}>
            Donate
          </div>
        </Link>
      </div>
      <Link className={classes.thermometerLink} to={`/posts/${lightconeFundraiserPostId.get()}`}>
        <div className={classes.thermometer}>
          <div className={classes.blurredUnfill}></div>
          <div className={classes.fill} style={{width: `${viewPercentage}%`, backgroundSize: `${100*100/viewPercentage}% auto`}}></div>
        </div>
      </Link>
      <div className={classes.textContainer}>
        <span className={classes.raisedText}><span className={classes.raisedTextBold}>Raised:</span> <span className={classes.raisedGoalNumber}>${Math.round(viewCurrentAmount).toLocaleString()}</span></span>
        <span className={classes.goalText}><span className={classes.goalTextBold}>Goal:</span> <span className={classes.raisedGoalNumber}>${goalAmount.toLocaleString()}</span></span>
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
