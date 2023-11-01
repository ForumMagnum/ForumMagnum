import React, { useCallback, useState } from "react";
import { Components, registerComponent } from "../../../lib/vulcan-lib";
import { useSingle } from "../../../lib/crud/withSingle";
import { useMulti } from "../../../lib/crud/withMulti";
import { AnalyticsContext, captureEvent } from "../../../lib/analyticsEvents";
import { Link } from "../../../lib/reactRouterWrapper";
import { SECTION_WIDTH } from "../../common/SingleColumnSection";
import { formatStat } from "../../users/EAUserTooltipContent";
import {
  useAmountRaised,
  useDonationOpportunities,
} from "./hooks";
import {
  donationElectionLink,
  donationElectionTagId,
  effectiveGivingTagId,
  postsAboutElectionLink,
  setupFundraiserLink,
  timelineSpec,
} from "../../../lib/eaGivingSeason";
import { DiscussIcon, DonateIcon, VoteIcon } from "../../icons/givingSeasonIcons";
import classNames from "classnames";
import { useMessages } from "../../common/withMessages";
import { useUpdateCurrentUser } from "../../hooks/useUpdateCurrentUser";
import { useCurrentUser } from "../../common/withUser";
import { useDialog } from "../../common/withDialog";

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
  rowThin: {
    display: "flex",
    gap: "20px",
    alignItems: "center",
    "@media screen and (max-width: 600px)": {
      flexDirection: "column",
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
  secondaryText: {
    color: theme.palette.givingPortal[900],
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
  textWide: {
    maxWidth: 780,
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
    padding: "12px 48px",
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
  },
  grid: {
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
  sequence: {
    maxWidth: 264,
  },
  hideOnMobile: {
    [theme.breakpoints.down("sm")]: {
      display: "none",
    },
  },
  mt10: { marginTop: 10 },
  mt20: { marginTop: 20 },
  mt30: { marginTop: 30 },
  mt60: { marginTop: 60 },
  mt80: { marginTop: 80 },
  mb20: { marginBottom: 20 },
  mb40: { marginBottom: 40 },
  mb80: { marginBottom: 80 },
  mb100: { marginBottom: 100 },
  w100: { width: "100%" },
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
    showAmountRaised,
    raisedForElectionFund,
    donationTarget,
    totalRaised,
  } = useAmountRaised();
  const {
    results: donationOpportunities,
    loading: donationOpportunitiesLoading,
  } = useDonationOpportunities();
  const {document: donationElectionTag} = useSingle({
    documentId: donationElectionTagId,
    collectionName: "Tags",
    fragmentName: "TagBasicInfo",
  });
  const {
    results: relevantSequences,
    loading: loadingRelevantSequences,
  } = useMulti({
    collectionName: "Sequences",
    fragmentName: "SequencesPageFragment",
    terms: {sequenceIds: [
      "wog9xb8cdqDySbBvM", // TODO: Add more sequences here
    ]},
  });
  const currentUser = useCurrentUser();
  const updateCurrentUser = useUpdateCurrentUser();
  const [notifyForVotingOn, setNotifyForVotingOn] = useState(currentUser?.givingSeasonNotifyForVoting ?? false);
  const {flash} = useMessages();
  const {openDialog} = useDialog();

  const onDonate = useCallback(() => {
    // TODO: Hook up donation
    // eslint-disable-next-line no-console
    console.log("Clicked donate");
  }, []);

  const toggleNotifyWhenVotingOpens = useCallback(() => {
    // TODO: captureEvent
    if (!currentUser) {
      openDialog({
        componentName: "LoginPopup",
        componentProps: {},
      })
    }
    setNotifyForVotingOn(!notifyForVotingOn);
    void updateCurrentUser({givingSeasonNotifyForVoting: !notifyForVotingOn});
    flash(`Notifications ${notifyForVotingOn ? "disabled" : "enabled"}`);
  }, [currentUser, openDialog, setNotifyForVotingOn, notifyForVotingOn, flash, updateCurrentUser]);

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

  const effectiveGivingPostsTerms = getListTerms(effectiveGivingTagId, "magic", 6);

  const totalAmount = formatDollars(totalRaised);
  const targetPercent = (raisedForElectionFund / donationTarget) * 100;

  const {
    Loading, HeadTags, Timeline, ElectionFundCTA, ForumIcon, PostsList2,
    ElectionCandidatesList, DonationOpportunity, CloudinaryImage2, EASequenceCard,
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
          <div className={classNames(
            classes.h2,
            classes.mt20,
            classes.hideOnMobile,
          )}>
            Timeline
          </div>
          <Timeline {...timelineSpec} className={classes.hideOnMobile} />
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
                  {showAmountRaised &&
                    <>
                      <div className={classes.progressBar}>
                        <div
                          className={classes.progress}
                          style={{width: `${targetPercent}%`}}
                        />
                      </div>
                      <div className={classes.raisedSoFar}>
                        {formatDollars(raisedForElectionFund)} raised so far
                      </div>
                    </>
                  }
                </ElectionFundCTA>
                <ElectionFundCTA
                  image={<DiscussIcon />}
                  title="Discuss"
                  description="Share post, quick takes and discuss  where the funds should go"
                  buttonText="Contribute to the discussion"
                  onButtonClick={onContribute}
                >
                  <Link
                    to={postsAboutElectionLink}
                    className={classes.underlinedLink}
                  >
                    View {donationElectionTag?.postCount} post{donationElectionTag?.postCount === 1 ? "" : "s"} about the Election
                  </Link>
                </ElectionFundCTA>
                <ElectionFundCTA
                  image={<VoteIcon />}
                  title="Vote"
                  description="Voting opens Dec 1. The Fund will be split proportionally between the top 3 winning candidates. You can already pre-vote below."
                  buttonText={notifyForVotingOn ? "You'll be notified when voting opens" : "Get notified when voting opens"}
                  buttonIcon={notifyForVotingOn ? undefined : "BellAlert"}
                  onButtonClick={toggleNotifyWhenVotingOpens}
                />
              </div>
            </div>
          </div>
        </div>
        <div className={classes.sectionDark}>
          <div className={classes.content}>
            <div className={classes.column}>
              <div className={classNames(classes.h2, classes.primaryText)}>
                Candidates in the Election
              </div>
              <div className={classNames(
                classes.text,
                classes.primaryText,
                classes.textWide,
                classes.mb20,
              )}>
                Candidates are EA projects (via{" "}
                <a href="https://www.givingwhatwecan.org/">
                  Giving What We Can
                </a>). The Fund will be split proportionally between the top 3
                winning candidates. Pre-vote to show which candidates you’re
                likely to vote for on December 1. Pre-votes don’t automatically
                turn into real votes, and you can change them at any time.
              </div>
              <ElectionCandidatesList className={classes.electionCandidates} />
              <div className={classNames(
                classes.rowThin,
                classes.mt10,
                classes.mb80,
              )}>
                <button onClick={onAddCandidate} className={classes.button}>
                  <ForumIcon icon="Plus" />
                  Add candidate
                </button>
                <div className={classNames(classes.text, classes.primaryText)}>
                  Deadline to add: November 30
                </div>
              </div>
            </div>
          </div>
        </div>
        <CloudinaryImage2 publicId="giving_portal_23_hero" fullWidthHeader />
        <div className={classes.sectionLight}>
          <div className={classes.content}>
            <div className={classNames(
              classes.column,
              classes.mt60,
              classes.mb80,
            )}>
              <div className={classNames(
                classes.h1,
                classes.secondaryText,
                classes.center,
                classes.mb20,
              )}>
                Donate, <span className={classes.primaryText}>Discuss</span>, Vote
              </div>
              <div className={classes.h4}>
                Recent posts tagged Effective giving
              </div>
              <div className={classNames(
                classes.postsList,
                classes.primaryLoadMore,
              )}>
                <PostsList2
                  terms={effectiveGivingPostsTerms}
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
          <div className={classNames(classes.text, classes.textWide)}>
            If you don’t want to donate to the Election Fund but still want to
            participate, you can donate directly to effective charities, or{" "}
            <a href={setupFundraiserLink}>set up your own fundraiser</a>.
          </div>
          {showAmountRaised &&
            <div className={classes.text}>
              Total donations raised through the Forum:{" "}
              <span className={classes.totalRaised}>{totalAmount}</span>
            </div>
          }
          <div className={classNames(classes.grid, classes.mt10)}>
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
        {/* TODO add in these sequences once more of them exist */}
        {/* <div className={classNames(classes.content, classes.mb100)}>
          <div className={classNames(classes.column, classes.w100)}>
            <div className={classes.h4}>
              Featured reading on Giving season
            </div>
            <div className={classes.grid}>
              {relevantSequences?.map((sequence) => (
                <EASequenceCard
                  key={sequence._id}
                  sequence={sequence}
                  className={classes.sequence}
                />
              ))}
            </div>
            {loadingRelevantSequences && <Loading />}
          </div>
        </div> */}
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
