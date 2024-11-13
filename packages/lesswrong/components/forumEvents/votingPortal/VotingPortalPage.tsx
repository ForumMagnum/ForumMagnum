import React, { useCallback, useState } from "react";
import { Components, registerComponent } from "../../../lib/vulcan-lib";
import { Link } from "@/lib/reactRouterWrapper";
import { MOBILE_HEADER_HEIGHT } from "@/components/common/Header";

const BACKGROUND_HREF = "https://res.cloudinary.com/cea/image/upload/v1731504237/Rectangle_5032.jpg";
const FUND_HREF = "https://www.every.org/effective-ventures-foundation-usa-inc-for-the-ea-forum-donation-election-fund-2024";
const VOTING_HREF = "#";
const CANDIDATES_HREF = "#";
const FRAUD_HREF = "#";
const RANKING_HREF = "#";

const styles = (theme: ThemeType) => ({
  root: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100vw",
    minHeight: "100vh",
    backgroundImage: `url(${BACKGROUND_HREF})`,
    backgroundRepeat: "no-repeat",
    backgroundSize: "cover",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: theme.palette.fonts.sansSerifStack,
    color: theme.palette.text.alwaysWhite,
    marginBottom: 0,
    fontWeight: 500,
    "& a": {
      textDecoration: "underline",
    },
    [theme.breakpoints.down(400)]: {
      paddingTop: MOBILE_HEADER_HEIGHT,
    },
  },
  welcomeRoot: {
    display: "flex",
    flexDirection: "column",
    gap: "24px",
    maxWidth: 600,
    padding: 24,
  },
  welcomeTitle: {
    fontSize: 50,
    fontWeight: 700,
  },
  welcomeDescription: {
    fontSize: 18,
    lineHeight: "150%",
    marginBottom: 8,
  },
  welcomeButton: {
    width: "100%",
    padding: "16px 24px",
    fontSize: 16,
    fontWeight: 600,
    lineHeight: "120%",
    color: theme.palette.givingSeason.portalPrimary,
    background: theme.palette.text.alwaysWhite,
    "&:hover": {
      background: theme.palette.text.alwaysWhite,
      opacity: 0.8,
    },
  },
  welcomeFootnote: {
    fontSize: 14,
    lineHeight: "140%",
    opacity: 0.7,
  },
  rankingRoot: {
    maxWidth: 680,
    padding: 24,
  },
  rankingInfo: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  rankingTitle: {
    fontSize: 40,
    fontWeight: 700,
  },
  rankingDescription: {
    fontSize: 16,
    lineHeight: "150%",
  },
  rankingSubDescription: {
    fontSize: 16,
    lineHeight: "150%",
    opacity: 0.7,
  },
  rankingCandidates: {
  },
  commentRoot: {
  },
  thankYouRoot: {
  },
});

const WelcomeScreen = ({onNext, classes}: {
  onNext?: () => void,
  classes: ClassesType<typeof styles>,
}) => {
  const {EAButton} = Components;
  return (
    <div className={classes.welcomeRoot}>
      <div className={classes.welcomeTitle}>
        Vote in the Donation Election 2024
      </div>
      <div className={classes.welcomeDescription}>
        The <Link to={FUND_HREF}>Donation Election Fund</Link> will be
        distributed to the top 3 candidates<sup>1</sup>. This year we&apos;re
        using <Link to={VOTING_HREF}>ranked-choice voting</Link>. You can change
        your vote<sup>2</sup> as many times as you like until the deadline. Find
        out more about the candidates <Link to={CANDIDATES_HREF}>here</Link>.
      </div>
      <EAButton onClick={onNext} className={classes.welcomeButton}>
        Vote in the Election -&gt;
      </EAButton>
      <div>
        <div className={classes.welcomeFootnote}>
          1. The Forum team reserves the right to revoke candidacy for any
          reason.
        </div>
        <div className={classes.welcomeFootnote}>
          2. Your vote is anonymous. If we have reason to believe you've
          committed <Link to={FRAUD_HREF}>voter fraud</Link>, for example by
          voting from more than one account, you could be banned from the Forum.
        </div>
      </div>
    </div>
  );
}

const RankingScreen = ({classes}: {
  onNext?: () => void,
  classes: ClassesType<typeof styles>,
}) => {
  return (
    <div className={classes.rankingRoot}>
      <div className={classes.rankingInfo}>
        <div className={classes.rankingTitle}>Rank the candidates</div>
        <div className={classes.rankingDescription}>
          Rank the candidates in descending order with your favourite at the
          top. Click on candidates to rank them, drag to change order. Unranked
          candidates get no points. Find out more{" "}
          <Link to={RANKING_HREF}>here</Link>.
        </div>
        <div className={classes.rankingSubDescription}>
          If you’re unsure about your ranking: vote, read more, and change your
          vote.
        </div>
      </div>
      <div className={classes.rankingCandidates}>
      </div>
    </div>
  );
}

const CommentScreen = ({classes}: {
  onNext?: () => void,
  classes: ClassesType<typeof styles>,
}) => {
  return (
    <div className={classes.commentRoot}>
      Comment
    </div>
  );
}

const ThankYouScreen = ({classes}: {
  onNext?: () => void,
  classes: ClassesType<typeof styles>,
}) => {
  return (
    <div className={classes.thankYouRoot}>
      Thank you
    </div>
  );
}

const SCREENS = ["welcome", "ranking", "comment", "thank-you"];
type Screen = typeof SCREENS[number];

const VotingPortalPage = ({classes}: {classes: ClassesType<typeof styles>}) => {
  const [screen, setScreen] = useState<Screen>("welcome");

  const onNext = useCallback(() => {
    setScreen((currentScreen) => SCREENS[SCREENS.indexOf(currentScreen) + 1]);
  }, []);

  return (
    <div className={classes.root}>
      {screen === "welcome" &&
        <WelcomeScreen onNext={onNext} classes={classes} />
      }
      {screen === "ranking" &&
        <RankingScreen onNext={onNext} classes={classes} />
      }
      {screen === "comment" &&
        <CommentScreen onNext={onNext} classes={classes} />
      }
      {screen === "thank-you" &&
        <ThankYouScreen onNext={onNext} classes={classes} />
      }
    </div>
  );
}

const VotingPortalPageComponent = registerComponent(
  "VotingPortalPage",
  VotingPortalPage,
  {styles},
);

declare global {
  interface ComponentTypes {
    VotingPortalPage: typeof VotingPortalPageComponent
  }
}
