import React from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib";
import { AnalyticsContext } from "../../lib/analyticsEvents";
import { Link } from "../../lib/reactRouterWrapper";
import classNames from "classnames";

const styles = (theme: ThemeType) => ({
  root: {
    fontFamily: theme.palette.fonts.sansSerifStack,
    color: theme.palette.grey[1000],
  },
  sectionLight: {
    backgroundColor: theme.palette.givingPortal.light,
  },
  sectionDark: {
    backgroundColor: theme.palette.givingPortal.dark,
    color: theme.palette.grey[0],
  },
  content: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
    maxWidth: 1252,
    padding: 40,
  },
  bold: {
    fontWeight: "bold",
  },
  center: {
    textAlign: "center",
    alignSelf: "center",
  },
  primaryText: {
    color: theme.palette.givingPortal.dark,
  },
  h1: {
    fontSize: 60,
    fontWeight: 700,
    lineHeight: "normal",
    letterSpacing: "-1.2px",
  },
  h2: {
    fontSize: 28,
    fontWeight: 700,
    lineHeight: "normal",
    letterSpacing: "-0.28px",
  },
  h3: {
    fontSize: 24,
    fontWeight: 700,
    lineHeight: "normal",
    letterSpacing: "-0.24px",
  },
  h4: {
    fontSize: 20,
    fontWeight: 700,
    lineHeight: "normal",
    letterSpacing: "-0.2px",
  },
  text: {
    maxWidth: 600,
    fontSize: 16,
    fontWeight: 500,
    lineHeight: "150%",
    "& a": {
      color: "inherit",
      textDecoration: "underline",
      fontWeight: 700,
    },
  },
});

const donationElectionLink = "#"; // TODO

const useAmountRaised = () => {
  // TODO: Query GWWC for the actual amount
  return 3720;
}

const EAGivingPortalPage = ({classes}: {classes: ClassesType}) => {
  const amountRaised = useAmountRaised();
  const {HeadTags} = Components;
  return (
    <AnalyticsContext pageContext="eaGivingPortal">
      <div className={classes.root}>
        <HeadTags title="Giving portal" />
        <div className={classes.content}>
          <div className={classNames(classes.h1, classes.center)}>
            Giving portal 2023
          </div>
          <div className={classNames(classes.text, classes.center)}>
            It’s Giving Season on the EA Forum. We’re hosting a{" "}
            <Link to={donationElectionLink}>Donation Election</Link> along
            with weekly themes throughout November and December.
          </div>
          <div className={classes.h2}>Timeline</div>
        </div>
        <div className={classes.sectionLight}>
          <div className={classes.content}>
            <div className={classNames(classes.h1, classes.primaryText)}>
              Donation election 2023
            </div>
            <div className={classes.text}>
              There is currently ${amountRaised} in the Election fund. On{" "}
              <span className={classes.bold}>December 15</span>, a winning
              Fundraiser will get everything in the Donation Election Fund,
              based on Forum users’ vote. Voting opens on{" "}
              <span className={classes.bold}>December 1st</span>.
            </div>
            <div>
              <Link
                to={donationElectionLink}
                className={classNames(classes.text, classes.primaryText)}
              >
                -&gt; Read more about the Donation Election.
              </Link>
            </div>
          </div>
        </div>
        <div className={classes.sectionDark}>
          <div className={classes.content}>
            <div className={classes.h2}>Candidates in the Election</div>
          </div>
        </div>
        <div className={classes.sectionLight}>
          <div className={classes.content}>
            <div className={classes.h4}>
              Recent posts tagged Donation Election 2023
            </div>
          </div>
        </div>
        <div className={classes.content}>
          <div className={classes.h3}>Other donation opportunities</div>
          <div className={classes.text}>
            If you don’t want to donate to the Election Fund but still want to
            participate, you can donate directly to effective charities.
          </div>
        </div>
        <div className={classes.content}>
          <div className={classes.h3}>
            Classic writing about effective giving
          </div>
        </div>
      </div>
    </AnalyticsContext>
  );
}

const EAGivingPortalPageComponent = registerComponent(
  "EAGivingPortalPage",
  EAGivingPortalPage,
  {styles},
);

declare global {
  interface ComponentTypes {
    EAGivingPortalPage: typeof EAGivingPortalPageComponent;
  }
}
