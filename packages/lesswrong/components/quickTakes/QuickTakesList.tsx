import React from "react";
import { registerComponent, Components } from "../../lib/vulcan-lib";
import { useMulti } from "../../lib/crud/withMulti";

const QuickTakesList = ({className}: {className?: string}) => {
  const {
    results,
    loading,
    showLoadMore,
    loadMoreProps,
  } = useMulti({
    terms: {
      view: "shortformFrontpage",
    },
    limit: 5,
    collectionName: "Comments",
    fragmentName: "ShortformComments",
  });
  const {QuickTakesListItem, Loading, SectionFooter, LoadMore} = Components;
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
);

declare global {
  interface ComponentTypes {
    QuickTakesList: typeof QuickTakesListComponent
  }
}
