import React, { useCallback, useEffect, useMemo } from "react";
import { defineStyles, useStyles } from "../../hooks/useStyles";
import { registerComponent } from "../../../lib/vulcan-lib/components";
import { sequenceGetPageUrl } from "@/lib/collections/sequences/helpers";
import { AnalyticsContext, useTracking } from "@/lib/analyticsEvents";
import { useCurrentUser } from "../../common/withUser";
import { useSingle } from "@/lib/crud/withSingle";
import { Link } from "@/lib/reactRouterWrapper";
import {
  MARGINAL_FUNDING_SEQUENCE_ID,
  MARGINAL_FUNDING_SPOTIFY_URL,
} from "@/lib/givingSeason";
import orderBy from "lodash/orderBy";
import classNames from "classnames";
import MarginalFundingSubscribeButton from "./MarginalFundingSubscribeButton";
import MarginalFundingShareButton from "./MarginalFundingShareButton";
import MarginalFundingListItem from "./MarginalFundingListItem";
import MarginalFundingCard from "./MarginalFundingCard";
import ForumIcon from "../../common/ForumIcon";
import Loading from "../../vulcan-core/Loading";
import { useItemsRead } from "../../hooks/useRecordPostView";

const styles = defineStyles("MarginalFundingPage", (theme) => ({
  root: {
    fontFamily: theme.palette.fonts.sansSerifStack,
    background: theme.palette.text.alwaysWhite,
    color: theme.palette.text.alwaysBlack,
    width: "100%",
    minHeight: "100vh",
  },
  loading: {
    paddingTop: 40,
    "& > div > *": {
      backgroundColor: `${theme.palette.text.alwaysBlack} !important`,
    },
  },
  container: {
    maxWidth: 1800,
    margin: "0 auto",
    background: theme.palette.text.alwaysBlack,
    borderRight: `1px solid ${theme.palette.text.alwaysBlack}`,
    borderLeft: `1px solid ${theme.palette.text.alwaysBlack}`,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    borderTop: `1px solid ${theme.palette.text.alwaysBlack}`,
    gap: 1,
    [theme.breakpoints.down("sm")]: {
      gridTemplateColumns: "1fr 1fr",
    },
    [theme.breakpoints.down("xs")]: {
      gridTemplateColumns: "1fr",
    },
  },
  header: {
    background: theme.palette.givingSeason.primary,
    gridColumn: "1 / 3",
    display: "flex",
    flexDirection: "column",
    gap: 50,
    padding: "65px 60px",
    "& > *": {
      maxWidth: "calc(min(700px, 100%))",
    },
    [theme.breakpoints.down("xs")]: {
      padding: "40px",
      gridColumn: "unset",
    },
  },
  options: {
    display: "flex",
    gap: "16px",
    flexWrap: "wrap",
    whiteSpace: "nowrap",
  },
  option: {
    fontFamily: theme.palette.fonts.sansSerifStack,
    fontSize: 14,
    fontWeight: 500,
    lineHeight: "140%",
    letterSpacing: "-0.02em",
    cursor: "pointer",
    background: "transparent",
    outline: "none",
    border: "none",
    display: "flex",
    gap: "8px",
    alignItems: "center",
    borderRadius: theme.borderRadius.default,
    padding: "4px 8px",
    transition: "background ease 0.2s",
    "& svg": {
      width: 20,
      height: 20,
    },
    "&:hover": {
      opacity: 1,
      background: theme.palette.greyAlpha(0.1),
    },
  },
  title: {
    fontSize: 72,
    fontWeight: 600,
    letterSpacing: "-0.07em",
    lineHeight: "110%",
  },
  description: {
    fontSize: 19,
    fontWeight: 500,
    letterSpacing: "-0.02em",
    lineHeight: "140%",
  },
  list: {
    width: "100%",
    display: "grid",
    gridTemplateColumns: "min-content 1fr",
    gap: "0px",
    rowGap: "1px",
    marginTop: 1,
    [theme.breakpoints.down("sm")]: {
      gridTemplateColumns: "1fr",
    },
  },
}));

export const MarginalFundingPage = () => {
  const currentUser = useCurrentUser();
  const {captureEvent} = useTracking()

  const {document: sequence, refetch} = useSingle({
    collectionName: "Sequences",
    fragmentName: "SequencesPageWithChaptersFragment",
    documentId: MARGINAL_FUNDING_SEQUENCE_ID,
    fetchPolicy: "network-only"
  });

  const {postsRead} = useItemsRead();

  // Refetch when any post in this sequence is marked as read
  useEffect(() => {
    const sequencePostIds = sequence?.chapters.flatMap(ch => ch.posts.map(p => p._id)) ?? [];
    const hasReadChanges = sequencePostIds.some(id => id in postsRead);
    if (hasReadChanges && refetch) {
      void refetch();
    }
  }, [postsRead, sequence, refetch]);

  const onListen = useCallback(() => {
    captureEvent("marginalFundingListenClick");
  }, [captureEvent]);

  const onEdit = useCallback(() => {
    captureEvent("marginalFundingEditClick");
  }, [captureEvent]);

  const [cardPosts, listPosts] = useMemo(() => {
    const posts = sequence?.chapters.flatMap((chapter) => chapter.posts) ?? [];

    if (posts.length === 0) {
      return [[], []]
    }

    const sortedPosts = [
      posts[0],
      ...orderBy(posts.slice(1), "baseScore", "desc"),
    ];
    const cardCount = 10;
    return [sortedPosts.slice(0, cardCount), sortedPosts.slice(cardCount)];
  }, [sequence]);

  const classes = useStyles(styles);
  if (!sequence) {
    return (
      <div className={classNames(classes.root, classes.loading)}>
        <Loading />
      </div>
    );
  }
  return (
    <AnalyticsContext pageContext="marginalFunding">
      <main className={classes.root}>
        <div className={classes.container}>
          <div className={classes.grid}>
            <div className={classes.header}>
              <div className={classes.options}>
                {MARGINAL_FUNDING_SPOTIFY_URL && <Link
                  to={MARGINAL_FUNDING_SPOTIFY_URL}
                  onClick={onListen}
                  className={classes.option}
                >
                  <ForumIcon icon="VolumeUp" /> Listen to the posts
                </Link>}
                <MarginalFundingSubscribeButton
                  sequence={sequence}
                  className={classes.option}
                />
                <MarginalFundingShareButton className={classes.option} />
                {currentUser?.isAdmin &&
                  <Link
                    to={sequenceGetPageUrl({_id: MARGINAL_FUNDING_SEQUENCE_ID})}
                    onClick={onEdit}
                    className={classes.option}
                  >
                    <ForumIcon icon="Pencil" /> Edit
                  </Link>
                }
              </div>
              <div className={classes.title}>{sequence.title}</div>
              {sequence.contents?.html &&
                <div
                  dangerouslySetInnerHTML={{__html: sequence.contents.html}}
                  className={classes.description}
                />
              }
            </div>
            {cardPosts.map((post) => (
              <MarginalFundingCard post={post} key={post._id} />
            ))}
          </div>
          <div className={classes.list}>
            {listPosts.map((post) => (
              <MarginalFundingListItem post={post} key={post._id} />
            ))}
          </div>
        </div>
      </main>
    </AnalyticsContext>
  );
}

export default registerComponent("MarginalFundingPage", MarginalFundingPage);
