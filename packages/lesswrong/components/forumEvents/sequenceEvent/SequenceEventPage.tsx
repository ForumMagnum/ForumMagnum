import React, { CSSProperties, useCallback, useEffect, useMemo } from "react";
import { defineStyles, useStyles } from "../../hooks/useStyles";
import { registerComponent } from "../../../lib/vulcan-lib/components";
import { sequenceGetPageUrl } from "@/lib/collections/sequences/helpers";
import { useTracking } from "@/lib/analyticsEvents";
import { useCurrentUser } from "../../common/withUser";
import { useItemsRead } from "../../hooks/useRecordPostView";
import { useSingle } from "@/lib/crud/withSingle";
import { Link } from "@/lib/reactRouterWrapper";
import { SINGLE_COLUMN_BREAKPOINT } from "@/lib/givingSeason";
import orderBy from "lodash/orderBy";
import classNames from "classnames";
import SequenceEventSubscribeButton from "./SequenceEventSubscribeButton";
import SequenceEventShareButton from "./SequenceEventShareButton";
import SequenceEventListItem from "./SequenceEventListItem";
import SequenceEventCard from "./SequenceEventCard";
import ForumIcon from "../../common/ForumIcon";
import Loading from "../../vulcan-core/Loading";

const styles = defineStyles("SequenceEventPage", (theme) => ({
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
    [theme.breakpoints.down(SINGLE_COLUMN_BREAKPOINT)]: {
      gridTemplateColumns: "1fr",
    },
  },
  header: {
    background: "var(--sequence-theme)",
    gridColumn: "1 / 3",
    display: "flex",
    flexDirection: "column",
    gap: 50,
    padding: "65px 60px",
    "& > *": {
      maxWidth: "calc(min(700px, 100%))",
    },
    [theme.breakpoints.down(SINGLE_COLUMN_BREAKPOINT)]: {
      padding: "40px",
      gridColumn: "unset",
    },
    [theme.breakpoints.down("xs")]: {
      padding: "40px 20px",
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
    color: theme.palette.text.alwaysBlack,
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
    [theme.breakpoints.down("sm")]: {
      fontSize: 56,
    },
    [theme.breakpoints.down("xs")]: {
      fontSize: 48,
    },
  },
  description: {
    fontSize: 19,
    fontWeight: 500,
    letterSpacing: "-0.02em",
    lineHeight: "140%",
    '& a': {
      textDecoration: 'underline',
      fontWeight: 600,
      textUnderlineOffset: '3px'
    },
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

export const SequenceEventPage = ({
  sequenceId,
  shareTitle,
  listenUrl,
  sharingUrl,
  themeColor,
  hoverColor,
}: {
  sequenceId: string,
  shareTitle: string,
  listenUrl?: string,
  sharingUrl: (source: string) => string,
  themeColor: string,
  hoverColor: string,
}) => {
  const currentUser = useCurrentUser();
  const {captureEvent} = useTracking();

  const {document: sequence, refetch} = useSingle({
    collectionName: "Sequences",
    fragmentName: "SequencesPageWithChaptersFragment",
    documentId: sequenceId,
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
    captureEvent("listenClick");
  }, [captureEvent]);

  const onEdit = useCallback(() => {
    captureEvent("editClick");
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
    <main
      style={{
        "--sequence-theme": themeColor,
        "--sequence-hover": hoverColor,
      } as CSSProperties}
      className={classes.root}
    >
      <div className={classes.container}>
        <div className={classes.grid}>
          <div className={classes.header}>
            <div className={classes.options}>
              {listenUrl && <Link
                to={listenUrl}
                onClick={onListen}
                className={classes.option}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ForumIcon icon="VolumeUp" /> Listen to the posts
              </Link>}
              <SequenceEventSubscribeButton
                sequence={sequence}
                className={classes.option}
              />
              <SequenceEventShareButton
                shareTitle={shareTitle}
                sharingUrl={sharingUrl}
                className={classes.option}
              />
              {currentUser?.isAdmin &&
                <Link
                  to={sequenceGetPageUrl({_id: sequenceId})}
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
            <SequenceEventCard post={post} key={post._id} />
          ))}
        </div>
        <div className={classes.list}>
          {listPosts.map((post) => (
            <SequenceEventListItem post={post} key={post._id} />
          ))}
        </div>
      </div>
    </main>
  );
}

export default registerComponent("SequenceEventPage", SequenceEventPage);
