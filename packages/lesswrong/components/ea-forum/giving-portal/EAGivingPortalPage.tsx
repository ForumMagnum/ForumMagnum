import React, { useCallback } from "react";
import { Components, registerComponent } from "../../../lib/vulcan-lib";
import { AnalyticsContext } from "../../../lib/analyticsEvents";
import { Link } from "../../../lib/reactRouterWrapper";
import { SECTION_WIDTH } from "../../common/SingleColumnSection";
import { formatStat } from "../../users/EAUserTooltipContent";
import {
  useAmountRaised,
  useDonationOpportunities,
  useElectionCandidates,
} from "./hooks";
import {
  donationElectionLink,
  donationElectionTagId,
  effectiveGivingTagId,
  timelineSpec,
  votingOpensDate,
} from "../../../lib/eaGivingSeason";
import classNames from "classnames";
import { DiscussIcon, DonateIcon, VoteIcon } from "../../icons/givingSeasonIcons";

const styles = (theme: ThemeType) => ({
  root: {
    fontFamily: theme.palette.fonts.sansSerifStack,
    color: theme.palette.grey[1000],
    backgroundColor: theme.palette.givingPortal[0],
    width: "100vw",
    overflow: "hidden",
  },
  sectionLight: {
    backgroundColor: theme.palette.givingPortal[200],
  },
  sectionDark: {
    backgroundColor: theme.palette.givingPortal[800],
    color: theme.palette.grey[0],
  },
  sectionSplit: {
    background: `linear-gradient(
      to top,
      ${theme.palette.givingPortal[800]} 100px,
      ${theme.palette.givingPortal[200]} 100px
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
    maxWidth: "100%",
  },
  bold: {
    fontWeight: "bold",
  },
  center: {
    textAlign: "center",
    alignSelf: "center",
  },
  primaryText: {
    color: theme.palette.givingPortal[1000],
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
      "&:hover": {
        opacity: 1,
        textDecoration: "none",
      },
    },
  },
  underlinedLink: {
    color: "inherit",
    textDecoration: "underline",
    "&:hover": {
      opacity: 1,
      textDecoration: "none",
    },
  },
  button: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    fontSize: 16,
    fontWeight: 600,
    background: theme.palette.grey[0],
    color: theme.palette.givingPortal[1000],
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
  progressBar: {
    position: "relative",
    width: "100%",
    height: 28,
    backgroundColor: theme.palette.givingPortal[800],
    borderRadius: theme.borderRadius.small,
    marginBottom: 20,
  },
  progress: {
    position: "absolute",
    left: 0,
    top: 0,
    backgroundColor: theme.palette.givingPortal[1000],
    borderRadius: theme.borderRadius.small,
    height: "100%",
  },
  raisedSoFar: {
    fontWeight: 700,
    fontSize: 20,
    letterSpacing: "-0.2px",
    color: theme.palette.grey[1000],
  },
  postsList: {
    width: SECTION_WIDTH,
    maxWidth: "100%",
    "& .LoadMore-root": {
      color: theme.palette.grey[600],
    },
  },
  primaryLoadMore: {
    "& .LoadMore-root": {
      color: theme.palette.givingPortal[1000],
    },
  },
  electionCandidates: {
    width: 1120,
    maxWidth: "100%",
    display: "flex",
    flexWrap: "wrap",
    gap: "16px",
    rowGap: "12px",
  },
  donationOpportunities: {
    width: "100%",
    display: "flex",
    flexWrap: "wrap",
    gap: "16px",
    rowGap: "16px",
    justifyContent: "center",
  },
  totalRaised: {
    fontSize: 24,
    fontWeight: 700,
    letterSpacing: "-0.24px",
    lineHeight: "140%",
    paddingLeft: 4,
  },
  loadMore: {
    color: theme.palette.givingPortal[1000],
    fontSize: 16,
    fontWeight: 700,
    letterSpacing: "-0.16px",
    cursor: "pointer",
    "&:hover": {
      opacity: 0.8,
    },
  },
  mt10: { marginTop: 10 },
  mt20: { marginTop: 20 },
  mt30: { marginTop: 30 },
  mt60: { marginTop: 60 },
  mt80: { marginTop: 80 },
  mb40: { marginBottom: 40 },
  mb80: { marginBottom: 80 },
  mb100: { marginBottom: 100 },
});

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

const formatDollars = (amount: number) => "$" + formatStat(amount);

const EAGivingPortalPage = ({classes}: {classes: ClassesType}) => {
  const {
    raisedForElectionFund,
    donationTarget,
    totalRaised,
  } = useAmountRaised();
  const {
    results: electionCandidates,
    loading: electionCandidatesLoading,
  } = useElectionCandidates();
  const {
    results: donationOpportunities,
    loading: donationOpportunitiesLoading,
  } = useDonationOpportunities();

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

  const onAddCandidate = useCallback(() => {
    // TODO: Hook up notifications
    // eslint-disable-next-line no-console
    console.log("Clicked add candidate");
  }, []);

  const onContribute = useCallback(() => {
    // TODO: Hook up contribute button
    // eslint-disable-next-line no-console
    console.log("Clicked contribute to the discussion");
  }, []);

  const onLoadMoreOpportunities = useCallback(() => {
    // TODO: Hook up loading more opportunities
    // eslint-disable-next-line no-console
    console.log("Clicked load more donation opportunities");
  }, []);

  const electionPostsTerms = getListTerms(donationElectionTagId, "new", 6);
  const classicPostsTerms = getListTerms(effectiveGivingTagId, "topAdjusted", 5);

  const totalAmount = formatDollars(totalRaised);
  const targetPercent = (raisedForElectionFund / donationTarget) * 100;

  const {
    Loading, HeadTags, Timeline, ElectionFundCTA, ForumIcon, PostsList2,
    ElectionCandidate, DonationOpportunity,
  } = Components;
  return (
    <AnalyticsContext pageContext="eaGivingPortal">
      <div className={classes.root}>
        <HeadTags title="Giving portal" />
        <div className={classNames(classes.content, classes.mb40)}>
          <div className={classNames(classes.h1, classes.center, classes.mt30)}>
            Giving portal 2023
          </div>
          <div className={classNames(classes.text, classes.center)}>
            It’s Giving Season on the EA Forum. We’re hosting a Donation
            Election along with weekly themes throughout November and December.
          </div>
          <div className={classNames(classes.h2, classes.mt20)}>Timeline</div>
          <Timeline {...timelineSpec} />
        </div>
        <div className={classes.sectionSplit}>
          <div className={classes.content}>
            <div className={classNames(classes.column, classes.mt80)}>
              <div className={classNames(classes.h1, classes.primaryText)}>
                Donation election 2023
              </div>
              <div className={classes.text}>
                <span className={classes.bold}>
                  To encourage more discussion about donation choice, consider
                  contributing to the Election Fund.
                </span>{" "}
                Starting 1 December, Forum users will vote on how to distribute
                the funds. It’s matched up to $5,000.{" "}
                <a href={donationElectionLink}>Read more here.</a>
              </div>
              <div className={classNames(classes.row, classes.mt20)}>
                <ElectionFundCTA
                  image={<DonateIcon />}
                  title="Donate"
                  description="Donate to the Election Fund"
                  buttonText="Donate"
                  onButtonClick={onDonate}
                  solidButton
                >
                  <div className={classes.progressBar}>
                    <div
                      className={classes.progress}
                      style={{width: `${targetPercent}%`}}
                    />
                  </div>
                  <div className={classes.raisedSoFar}>
                    {formatDollars(raisedForElectionFund)} raised so far
                  </div>
                </ElectionFundCTA>
                <ElectionFundCTA
                  image={<DiscussIcon />}
                  title="Discuss"
                  description="Share post, quick takes and discuss  where the funds should go"
                  buttonText="Contribute to the discussion"
                  onButtonClick={onContribute}
                >
                  <Link to="#" className={classes.underlinedLink}> {/* TODO: Correct link */}
                    View 14 posts about the Election
                  </Link>
                </ElectionFundCTA>
                <ElectionFundCTA
                  image={<VoteIcon />}
                  title="Vote"
                  description="Voting opens Dec 1. The Fund will be split proportionally between the top 3 winning candidates. You can already pre-vote below."
                  buttonText="Get notified when voting opens"
                  buttonIcon="BellAlert"
                  onButtonClick={onNotifyWhenVotingOpens}
                />
              </div>
            </div>
          </div>
        </div>
        <div className={classes.sectionDark}>
          <div className={classes.content}>
            <div className={classes.column}>
              <div className={classes.h2}>Candidates in the Election</div>
              <div className={classes.electionCandidates}>
                {electionCandidates?.map((candidate) => (
                  <ElectionCandidate candidate={candidate} key={candidate._id} />
                ))}
                {electionCandidatesLoading && <Loading />}
              </div>
              <div className={classes.mb100}>
                <button
                  onClick={onAddCandidate}
                  className={classNames(classes.button, classes.mt10)}
                >
                  <ForumIcon icon="Plus" />
                  Add candidate
                </button>
              </div>
            </div>
          </div>
        </div>
        <div className={classes.sectionLight}>
          <div className={classes.content}>
            <div className={classNames(
              classes.column,
              classes.mt60,
              classes.mb80,
            )}>
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
        <div className={classNames(
          classes.content,
          classes.mt60,
          classes.mb80,
        )}>
          <div className={classes.h3}>Other donation opportunities</div>
          <div className={classes.text}>
            If you don’t want to donate to the Election Fund but still want to
            participate, you can donate directly to effective charities.
          </div>
          <div className={classes.text}>
            Total donations raised through the Forum:{" "}
            <span className={classes.totalRaised}>{totalAmount}</span>
          </div>
          <div className={classNames(classes.donationOpportunities, classes.mt10)}>
            {donationOpportunities?.map((candidate) => (
              <DonationOpportunity candidate={candidate} key={candidate._id} />
            ))}
            {donationOpportunitiesLoading && <Loading />}
          </div>
          <div onClick={onLoadMoreOpportunities} className={classes.loadMore}>
            {/* TODO: Hook up this load more button */}
            Load more
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
