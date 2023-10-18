import React, { useCallback } from "react";
import { Components, registerComponent } from "../../../lib/vulcan-lib";
import { AnalyticsContext } from "../../../lib/analyticsEvents";
import { Link } from "../../../lib/reactRouterWrapper";
import { SECTION_WIDTH } from "../../common/SingleColumnSection";
import type { TimelineSpec } from "./Timeline";
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
  sectionSplit: {
    background: `linear-gradient(
      to top,
      ${theme.palette.givingPortal.dark} 100px,
      ${theme.palette.givingPortal.light} 100px
    )`,
  },
  content: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
    maxWidth: 1252,
    padding: 40,
    margin: "0 auto",
  },
  row: {
    display: "flex",
    gap: "20px",
    marginTop: 80,
    "@media screen and (max-width: 1000px)": {
      flexDirection: "column",
      alignItems: "center",
    },
  },
  column: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
    margin: "0 auto",
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
  button: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    fontSize: 16,
    fontWeight: 600,
    background: theme.palette.grey[0],
    color: theme.palette.givingPortal.dark,
    borderRadius: theme.borderRadius.small,
    padding: "12px 16px",
    border: "none",
    outline: "none",
    "&:hover": {
      opacity: 0.85,
    },
    "&:active": {
      opacity: 0.7,
    },
  },
  postsList: {
    width: SECTION_WIDTH,
    "& .LoadMore-root": {
      color: theme.palette.grey[600],
    },
  },
  primaryLoadMore: {
    "& .LoadMore-root": {
      color: theme.palette.givingPortal.dark,
    },
  },
  verticalMargin: {
    marginTop: 60,
    marginBottom: 80,
  },
});

const useAmountRaised = () => {
  // TODO: Query GWWC for the actual amount
  return 3720;
}

const donationElectionLink = "#"; // TODO

const votingOpensDate = new Date("2023-12-01");

const donationTarget = 15000;

const donationElectionTagId = "L6NqHZkLc4xZ7YtDr"; // TODO: This tag doesn't exist yet
const effectiveGivingTagId = "L6NqHZkLc4xZ7YtDr";

const timelineSpec: TimelineSpec = {
  start: new Date("2023-11-15"),
  end: new Date("2023-12-31"),
  points: [
    {date: new Date("2023-11-28"), description: "Giving Tuesday"},
    {date: votingOpensDate, description: "Voting starts"},
    {date: new Date("2023-12-15"), description: "Voting ends"},
    {date: new Date("2023-12-20"), description: "Election winner announced"},
  ],
  spans: [
    {
      start: new Date("2023-11-21"),
      end: new Date("2023-11-28"),
      description: "Effective giving spotlight Week",
    },
    {
      start: new Date("2023-11-30"),
      end: new Date("2023-12-07"),
      description: "Marginal Funding Week",
    },
    {
      start: new Date("2023-12-08"),
      end: new Date("2023-12-16"),
      description: "Forum BOTEC-a-thon Week",
    },
  ],
};

const getListTerms = (
  tagId: string,
  sortedBy: string,
  limit: number,
) => ({
  filterSettings: {
    tags: [
      {
        tagId,
        filterMode: "Required",
      },
    ],
  },
  sortedBy,
  limit,
});

const EAGivingPortalPage = ({classes}: {classes: ClassesType}) => {
  const amountRaised = useAmountRaised();

  const onDonate = useCallback(() => {
    // TODO: Hook up donation
    // eslint-disable-next-line no-console
    console.log("Clicked donate");
  }, []);

  const onNotifyWhenVotingOpens = useCallback(() => {
    // TODO: Hook up notifications
    // eslint-disable-next-line no-console
    console.log("Clicked notify when voting opens");
  }, []);

  const onContribute = useCallback(() => {
    // TODO: Hook up notifications
    // eslint-disable-next-line no-console
    console.log("Clicked contribute to the discussion");
  }, []);

  const electionPostsTerms = getListTerms(donationElectionTagId, "new", 6);
  const classicPostsTerms = getListTerms(effectiveGivingTagId, "topAdjusted", 5);

  const {HeadTags, Timeline, ElectionFundCTA, ForumIcon, PostsList2} = Components;
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
          <Timeline {...timelineSpec} />
        </div>
        <div className={classes.sectionSplit}>
          <div className={classes.content}>
            <div className={classes.row}>
              <div className={classes.column}>
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
                <div>
                  <button
                    onClick={onNotifyWhenVotingOpens}
                    className={classes.button}
                  >
                    <ForumIcon icon="BellAlert" />
                    Get notified when the voting opens
                  </button>
                </div>
              </div>
              <ElectionFundCTA
                amountRaised={amountRaised}
                donationTarget={donationTarget}
                votingOpensDate={votingOpensDate}
                onDonate={onDonate}
              />
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
            <div className={classNames(classes.column, classes.verticalMargin)}>
              <div className={classes.h4}>
                Recent posts tagged Donation Election 2023
              </div>
              <div className={classNames(
                classes.postsList,
                classes.primaryLoadMore,
              )}>
                <PostsList2
                  terms={electionPostsTerms}
                  loadMoreMessage="View more"
                />
              </div>
              <div>
                <button onClick={onContribute} className={classes.button}>
                  Contribute to the discussion
                </button>
              </div>
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
          <div className={classes.column}>
            <div className={classes.h3}>
              Classic writing about effective giving
            </div>
            <div className={classes.postsList}>
              <PostsList2
                terms={classicPostsTerms}
                loadMoreMessage="View more"
              />
            </div>
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
