import React from "react";
import { registerComponent, Components } from "../../lib/vulcan-lib";
import { useMulti } from "../../lib/crud/withMulti";
import { isLWorAF } from "../../lib/instanceSettings";
import { AnalyticsContext } from "../../lib/analyticsEvents";

const styles = (theme: ThemeType) => ({
  root: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    fontFamily: theme.palette.fonts.sansSerifStack,
    fontSize: 14,
    fontWeight: 500,
    color: theme.palette.grey[1000],
  },
});

const QuickTakesList = ({showCommunity, tagId, maxAgeDays, className, classes}: {
  showCommunity?: boolean,
  tagId?: string,
  maxAgeDays?: number,
  className?: string,
  classes: ClassesType,
}) => {
  const {
    results,
    loading,
    showLoadMore,
    loadMoreProps,
  } = useMulti({
    terms: {
      view: "shortformFrontpage",
      showCommunity,
      relevantTagId: tagId,
      maxAgeDays,
    },
    limit: 5,
    collectionName: "Comments",
    fragmentName: "ShortformComments",
  });
  const {LWShortform, QuickTakesListItem, Loading, SectionFooter, LoadMore} = Components;

  if (isLWorAF) {
    return (
      <AnalyticsContext pageSectionContext="shortformList">
        <div className={classes.root}>
          {results?.map((comment) =>
            <LWShortform
              key={comment._id}
              comment={comment}
            />
          )}
          <LoadMore {...loadMoreProps} />
        </div>
      </AnalyticsContext>
    ); 
  }

  return (
    <div className={className}>
      {results?.map((result) =>
        <QuickTakesListItem key={result._id} quickTake={result} />
      )}
      {loading && <Loading />}
      {showLoadMore &&
        <SectionFooter>
          <LoadMore
            {...loadMoreProps}
            sectionFooterStyles
          />
        </SectionFooter>
      }
    </div>
  );
}

const QuickTakesListComponent = registerComponent(
  "QuickTakesList",
  QuickTakesList,
  {styles}
);

declare global {
  interface ComponentTypes {
    QuickTakesList: typeof QuickTakesListComponent
  }
}
