import { registerComponent } from '@/lib/vulcan-lib';
import React, { useEffect, useState } from 'react';
import { useTheme } from '../themes/useTheme';
import { lightconeFundraiserThermometerBgUrl, lightconeFundraiserUnsyncedAmount } from '@/lib/publicSettings';
import { gql, useQuery } from '@apollo/client';
import { Link } from '@/lib/reactRouterWrapper';
import { useFundraiserStripeTotal, useLivePercentage } from '@/lib/lightconeFundraiser';

interface FundraisingThermometerProps {
  goalAmount: number;
}

const styles = (theme: ThemeType) => ({
  thermometer: {
    width: '100%',
    height: '100px',
    backgroundColor: '#8b953a',
    borderRadius: '15px',
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
    boxShadow: `5px 0px 10px #222`,
  },
  text: {
    position: 'relative',
    zIndex: 2,
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    mixBlendMode: 'difference',
    transition: 'background 0.5s ease-in-out',
    color: '#ffffff',
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
    fontWeight: 'bold',
    fontFamily: theme.typography.headerStyle.fontFamily,
    padding: '0 15px',
    marginBottom: 0,  
  },
  subheader: {
    color: theme.palette.review.winner,
    fontSize: '1.2rem',
    fontFamily: theme.typography.headerStyle.fontFamily,
    padding: '0 15px',
  },
  textContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    width: '100%',
    padding: '0 15px',
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
  const stripeTotal = useFundraiserStripeTotal();
  const unsyncedAmount = lightconeFundraiserUnsyncedAmount.get();
  const currentAmount = unsyncedAmount + stripeTotal;
  // const percentage = Math.min((currentAmount / goalAmount) * 100, 100);
  const percentage = Math.min(useLivePercentage(), 100);


  return (
    <div className={classes.fundraiserContainer}>
      <div className={classes.fundraiserHeader}>
        <div className={classes.fundraiserHeaderText}>
          <h2 className={classes.header}>Lightcone Infrastructure fundraiser progress</h2>
          <h3 className={classes.subheader}>Goal 1: June</h3>
        </div>
        <div className={classes.fundraiserHeaderDonateButton}>
          <Link className={classes.fundraiserDonateText} to="https://lightconeinfrastructure.com/donate">Donate</Link>
        </div>
      </div>
      <div className={classes.thermometer}>
        <div className={classes.blurredUnfill}></div>
        <div className={classes.fill} style={{width: `${percentage}%`, backgroundSize: `${100*100/percentage}% auto`}}></div>
      </div>
      <div className={classes.textContainer}>
        <span className={classes.raisedText}><span className={classes.raisedTextBold}>Raised:</span> <span className={classes.raisedGoalNumber}>${currentAmount.toLocaleString()}</span></span>
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
