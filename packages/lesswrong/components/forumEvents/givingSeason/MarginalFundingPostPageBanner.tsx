import React from "react";
import { registerComponent } from "../../../lib/vulcan-lib/components";
import { useSingle } from "../../../lib/crud/withSingle";
import { MARGINAL_FUNDING_SEQUENCE_ID } from "../../../lib/givingSeason";
import { Link } from "../../../lib/reactRouterWrapper";
import { sequenceGetPageUrl } from "../../../lib/collections/sequences/helpers";

const styles = (theme: ThemeType) => ({
  root: {
    width: "100%",
    height: 60,
    backgroundColor: "#FF7454",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "0 20px",
    gap: "20px",
  },
  label: {
    fontSize: 14,
    fontWeight: 500,
  },
  title: {
    fontSize: 16,
    fontWeight: 600,
    flex: 1,
  },
  viewAllButton: {
    padding: "8px 16px",
    backgroundColor: "rgba(0, 0, 0, 0.1)",
    borderRadius: 4,
    fontSize: 14,
    fontWeight: 500,
    textDecoration: "none",
    color: "inherit",
    whiteSpace: "nowrap",
    "&:hover": {
      backgroundColor: "rgba(0, 0, 0, 0.2)",
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
      <span className={classes.label}>Part of Marginal Funding Week 2025</span>
      <span className={classes.title}>{sequence.title}</span>
      <Link to="/marginal-funding" className={classes.viewAllButton}>
        View all {postsCount} posts
      </Link>
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

