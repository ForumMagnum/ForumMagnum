import React from 'react';
import { Components, registerComponent } from '../../../lib/vulcan-lib';
import classNames from 'classnames';
import { votingPortalStyles } from './styles';
import { Link } from '../../../lib/reactRouterWrapper';

const styles = (theme: ThemeType) => ({
  ...votingPortalStyles(theme),
  footer: {
    display: "flex",
    marginTop: "auto",
    justifyContent: "center",
    backgroundColor: theme.palette.givingPortal[200],
  },
  footerInner: {
    padding: "20px 40px",
    display: "flex",
    justifyContent: "space-between",
    maxWidth: 1000,
    width: "100%",
    gap: "32px",
    [theme.breakpoints.down("xs")]: {
      flexDirection: "column",
      gap: "20px",
      padding: "20px 24px",
    },
  },
  footerTopRow: {
    display: "flex",
    flex: 1,
    justifyContent: "space-between",
    alignItems: "center",
    gap: 20,
    fontWeight: 600,
    fontSize: 16,
    color: theme.palette.givingPortal[1000],
  },
  continueButton: {
    flex: 1,
    width: "100%",
    maxWidth: 244,
    height: 51,
    alignSelf: "flex-end",
  },
  backLink: {
    gap: "6px",
    display: "flex",
    alignItems: "center",
    // This margin is to make the footer look visually centered on large screens (even though it is already
    // centered, the button on the right makes it look off balance)
    marginLeft: 20,
    [theme.breakpoints.down("sm")]: {
      marginLeft: 0,
    },
  },
  arrowIcon: {
    fontSize: 18,
  },
  arrowLeft: {
    transform: "rotate(180deg)",
  },
});

export const VotingPortalFooter = ({
  leftText="Previous step",
  leftHref,
  middleNode,
  buttonText="Continue",
  buttonProps,
  classes,
}: {
  leftText?: string,
  leftHref: string,
  middleNode: React.ReactNode,
  buttonText?: string,
  buttonProps: React.ButtonHTMLAttributes<HTMLButtonElement>,
  classes: ClassesType<typeof styles>,
}) => {
  const { ForumIcon } = Components;

  return (
    <div className={classes.footer}>
      <div className={classes.footerInner}>
        <div className={classes.footerTopRow}>
          <Link to={leftHref} className={classes.backLink}>
            <ForumIcon icon="ArrowRight" className={classNames(classes.arrowIcon, classes.arrowLeft)} /> {leftText}
          </Link>
          {middleNode}
        </div>
        <button
          {...buttonProps}
          className={classNames(classes.button, classes.continueButton, {
            [classes.buttonDisabled]: buttonProps.disabled,
          })}
        >
          {buttonText} <ForumIcon icon="ArrowRight" className={classes.arrowIcon} />
        </button>
      </div>
    </div>
  );
}

const VotingPortalFooterComponent = registerComponent('VotingPortalFooter', VotingPortalFooter, {styles});

declare global {
  interface ComponentTypes {
    VotingPortalFooter: typeof VotingPortalFooterComponent
  }
}
