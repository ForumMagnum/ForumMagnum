import React from "react";
import { registerComponent } from "../../../lib/vulcan-lib/components";
import { useSingle } from "../../../lib/crud/withSingle";
import { MARGINAL_FUNDING_SEQUENCE_ID } from "../../../lib/givingSeason";
import { Link } from "../../../lib/reactRouterWrapper";

const styles = (theme: ThemeType) => ({
  root: {
    fontFamily: theme.palette.fonts.sansSerifStack,
    width: "100%",
    backgroundColor: theme.palette.givingSeason.primary,
    color: theme.palette.text.alwaysBlack,
    display: "flex",
    justifyContent: "center",
    padding: "16px 24px",
    borderTop: `1px solid ${theme.palette.text.alwaysBlack}`,
    borderBottom: `1px solid ${theme.palette.text.alwaysBlack}`,
  },
  content: {
    width: "100%",
    maxWidth: 1300,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "24px",
    [theme.breakpoints.down("xs")]: {
      flexDirection: "column",
      alignItems: "flex-start",
      gap: "12px",
    },
  },
  textContent: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    flex: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: 600,
    letterSpacing: "-0.01em",
    lineHeight: "140%",
    opacity: 0.6,
  },
  title: {
    fontSize: 18,
    fontWeight: 600,
    letterSpacing: "-0.02em",
    lineHeight: "140%",
  },
  viewAllButton: {
    fontFamily: theme.palette.fonts.sansSerifStack,
    fontSize: 14,
    fontWeight: 600,
    letterSpacing: "-0.01em",
    lineHeight: "140%",
    padding: "10px 16px",
    backgroundColor: theme.palette.text.alwaysBlack,
    color: theme.palette.text.alwaysWhite,
    borderRadius: theme.borderRadius.default,
    textDecoration: "none",
    whiteSpace: "nowrap",
    border: "none",
    cursor: "pointer",
    transition: "opacity ease 0.2s",
    "&:hover": {
      opacity: 0.85,
    },
    [theme.breakpoints.down("xs")]: {
      width: "100%",
      textAlign: "center",
    },
  },
});

const MarginalFundingPostPageBanner = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {
  const { document: sequence, loading } = useSingle({
    collectionName: "Sequences",
    fragmentName: "SequencesPageFragment",
    documentId: MARGINAL_FUNDING_SEQUENCE_ID,
  });

  if (loading || !sequence) {
    return null;
  }

  const postsCount = sequence.postsCount || 0;

  return (
    <div className={classes.root}>
      <div className={classes.content}>
        <div className={classes.textContent}>
          <div className={classes.label}>Part of Marginal Funding Week 2025</div>
          <div className={classes.title}>{sequence.title}</div>
        </div>
        <Link to="/marginal-funding" className={classes.viewAllButton}>
          View all {postsCount} posts
        </Link>
      </div>
    </div>
  );
}

const MarginalFundingPostPageBannerComponent = registerComponent(
  "MarginalFundingPostPageBanner",
  MarginalFundingPostPageBanner,
  {styles},
);

declare global {
  interface ComponentTypes {
    MarginalFundingPostPageBanner: typeof MarginalFundingPostPageBannerComponent
  }
}

export default MarginalFundingPostPageBannerComponent;
