import React, { useState } from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { useMulti } from '../../lib/crud/withMulti';
import { AnalyticsContext } from '../../lib/analyticsEvents';
import CoreTagCard from "./CoreTagCard";

const styles = (theme: ThemeType) => ({
  root: {
    marginBottom: 16,
  },
  grid: {
    display: "grid",
    // tags flow into grid with 2 per row on large screens, 1 per row on small screens
    gridTemplateColumns: "repeat(auto-fit, minmax(310px, 1fr))",
    gridGap: "8px",
  },
  showMore: {
    ...theme.typography.body2,
    color: theme.palette.primary.main,
    fontSize: 14,
    fontWeight: 600,
    marginTop: 8,
  }
});

const INITIAL_LIMIT = 8;

const CoreTagsSection = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {
  const { results } = useMulti({
    terms: {
      view: "coreTags",
      limit: 100,
    },
    collectionName: "Tags",
    fragmentName: "TagDetailsFragment",
    enableTotal: false,
  });

  const [showAll, setShowAll] = useState(false);
  const resultsToDisplay = showAll ? results : results?.slice(0, INITIAL_LIMIT);
  return (
    <AnalyticsContext pageSectionContext="coreTagsSection">
      <div className={classes.root}>
        <div className={classes.grid}>
          {resultsToDisplay?.map((tag) => (
            <CoreTagCard key={tag._id} tag={tag} />
          ))}
        </div>
        <div className={classes.showMore}>
          {!!results?.length && results?.length > INITIAL_LIMIT && (
            <a onClick={() => setShowAll(!showAll)}>Show {showAll ? "less" : `${results.length - INITIAL_LIMIT} more`}</a>
          )}
        </div>
      </div>
    </AnalyticsContext>
  );
}

export default registerComponent("CoreTagsSection", CoreTagsSection, {styles});


