import React from "react";
import { defineStyles, useStyles } from '../hooks/useStyles';
import { registerComponent } from "../../lib/vulcan-lib/components";
import { AnalyticsContext } from "@/lib/analyticsEvents";
import { useSingle } from "@/lib/crud/withSingle";
import MarginalFundingCard from "./MarginalFundingCard";
import Loading from "../vulcan-core/Loading";

const styles = defineStyles("MarginalFundingPage", (theme) => ({
  root: {
    fontFamily: theme.palette.fonts.sansSerifStack,
    background: theme.palette.text.alwaysWhite,
    color: theme.palette.text.alwaysBlack,
    width: "100%",
    minHeight: "100vh",
  },
  container: {
    maxWidth: 1800,
    margin: "0 auto",
    background: theme.palette.text.alwaysBlack,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    borderTop: `1px solid ${theme.palette.text.alwaysBlack}`,
    gap: 1,
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
  },
  title: {
    fontSize: 72,
    fontWeight: 600,
    letterSpacing: "-0.07em",
  },
  description: {
    fontSize: 19,
    fontWeight: 500,
    letterSpacing: "-0.02em",
  },
  list: {
    display: "flex",
    flexDirection: "column",
  },
}));

export const MarginalFundingPage = () => {
  const {document: sequence} = useSingle({
    collectionName: "Sequences",
    fragmentName: "SequencesPageWithChaptersFragment",
    documentId: "GxLPEuy84SkDEXTmZ",
  });
  const classes = useStyles(styles);
  if (!sequence) {
    return <Loading />
  }
  const posts = sequence.chapters.flatMap((chapter) => chapter.posts);
  const cardPosts = posts.slice(0, 10);
  const listPosts = posts.slice(10);
  return (
    <AnalyticsContext pageContext="marginalFunding">
      <main className={classes.root}>
        <div className={classes.container}>
          <div className={classes.grid}>
            <div className={classes.header}>
              <div>
                Sharing etc.
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
            {listPosts.map((_post) => (
              null // TODO
            ))}
          </div>
        </div>
      </main>
    </AnalyticsContext>
  );
}

export default registerComponent('MarginalFundingPage', MarginalFundingPage);
