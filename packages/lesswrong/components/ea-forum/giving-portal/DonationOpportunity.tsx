import React from "react";
import { registerComponent } from "../../../lib/vulcan-lib";
import classNames from "classnames";
import { Link } from "../../../lib/reactRouterWrapper";

const imageWidth = 70;
const imageHeight = 60;

const styles = (theme: ThemeType) => ({
  root: {
    width: 280,
    height: 265,
    backgroundColor: theme.palette.givingPortal[0],
    boxShadow: `0px 2px 6px 0px ${theme.palette.greyAlpha(0.1)}`,
    borderRadius: theme.borderRadius.default,
    padding: 16,
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    fontFamily: theme.palette.fonts.sansSerifStack,
    color: theme.palette.grey[1000],
  },
  header: {
    display: "flex",
    gap: "16px",
    alignItems: "center",
  },
  imageContainer: {
    borderRadius: theme.borderRadius.small,
    backgroundColor: theme.palette.grey[0],
    width: imageWidth,
    height: imageHeight,
  },
  image: {
    borderRadius: theme.borderRadius.small,
    objectFit: "cover",
    width: imageWidth,
    height: imageHeight,
  },
  name: {
    fontSize: 18,
    fontWeight: 600,
    letterSpacing: "-0.18px",
  },
  description: {
    position: 'relative',
    color: theme.palette.grey[600],
    fontSize: 14,
    fontWeight: 500,
    letterSpacing: "-0.14px",
    lineHeight: "140%",
    flexGrow: 1,
    overflow: 'hidden',
    '&:after': {
      position: 'absolute',
      left: 0,
      bottom: 0,
      width: '100%',
      height: 50,
      content: "''",
      background: `linear-gradient(to top, ${theme.palette.givingPortal[0]}, ${theme.palette.background.transparent})`,
      pointerEvents: 'none'
    }
  },
  buttons: {
    display: "flex",
    gap: "8px",
    alignItems: "center",
  },
  button: {
    textAlign: 'center',
    padding: 12,
    borderRadius: theme.borderRadius.small,
    border: "none",
    outline: "none",
    fontSize: 14,
    fontWeight: 600,
    width: "50%",
    "&:hover": {
      opacity: 0.8,
    },
    "&:active": {
      opacity: 0.7,
    },
  },
  buttonPrimary: {
    backgroundColor: theme.palette.givingPortal.button.alwaysDark,
    color: theme.palette.text.alwaysWhite,
  },
  buttonGrey: {
    backgroundColor: theme.palette.grey[200],
    color: theme.palette.grey[1000],
  },
});

const DonationOpportunity = ({candidate, classes}: {
  candidate: ElectionCandidateBasicInfo,
  classes: ClassesType,
}) => {
  const {name, logoSrc, description} = candidate;
  return (
    <div className={classes.root}>
      <Link to={candidate.href}>
        <div className={classes.header}>
          <div className={classes.imageContainer}>
            <img src={logoSrc} className={classes.image} />
          </div>
          <div className={classes.name}>{name}</div>
        </div>
      </Link>
      <div className={classes.description}>{description}</div>
      <div className={classes.buttons}>
        {candidate.fundraiserLink && <Link to={candidate.fundraiserLink} className={classNames(classes.button, classes.buttonPrimary)}>
          Donate
        </Link>}
        {candidate.gwwcLink && <Link to={candidate.gwwcLink} className={classNames(classes.button, classes.buttonGrey)}>
          Learn more
        </Link>}
      </div>
    </div>
  );
}

const DonationOpportunityComponent = registerComponent(
  "DonationOpportunity",
  DonationOpportunity,
  {styles},
);

declare global {
  interface ComponentTypes {
    DonationOpportunity: typeof DonationOpportunityComponent;
  }
}
