import React from "react";
import { registerComponent, Components } from "../../lib/vulcan-lib";
import classNames from "classnames";
import { useMulti } from "../../lib/crud/withMulti";

const styles = (_theme: ThemeType) => ({
  root: {
  },
});

const QuickTakesList = ({className, classes}: {
  className?: string,
  classes: ClassesType,
}) => {
  const {results, loading, count, totalCount, loadMoreProps, refetch} = useMulti({
    terms: {
      view: "shortformFrontpage",
    },
    limit: 5,
    enableTotal: true,
    collectionName: "Comments",
    fragmentName: "ShortformComments",
  });

  // TODO
  void count;
  void totalCount;
  void loadMoreProps;
  void refetch;

  const {Loading, QuickTakesListItem} = Components;
  return (
    <div className={classNames(classes.root, className)}>
      {loading && <Loading />}
      {results?.map((result) =>
        <QuickTakesListItem key={result._id} quickTake={result} />
      )}
    </div>
  );
}

const QuickTakesListComponent = registerComponent(
  "QuickTakesList",
  QuickTakesList,
  {styles},
);

declare global {
  interface ComponentTypes {
    QuickTakesList: typeof QuickTakesListComponent
  }
}
