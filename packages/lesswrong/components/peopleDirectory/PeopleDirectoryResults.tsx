import React from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib";
import { usePeopleDirectory } from "./usePeopleDirectory";
import { SCROLL_INDICATOR_SIZE } from "../common/HorizScrollBlock";
import { useObserver } from "../hooks/useObserver";

const HORIZ_PADDING = 24;

const styles = (theme: ThemeType) => ({
  root: {
    marginLeft: -SCROLL_INDICATOR_SIZE,
    width: `calc(100% + ${2 * SCROLL_INDICATOR_SIZE}px)`,
    maxWidth: "unset !important", // Overwrite the HorizScrollBlock default
  },
  contents: {
    border: `1px solid ${theme.palette.grey[300]}`,
    borderRadius: theme.borderRadius.default,
    background: theme.palette.grey[0],
    // Overwrite the HorizScrollBlock default
    padding: `12px 0 12px ${HORIZ_PADDING}px !important`, // See firefox bug below
    margin: "0 !important",
  },
  // We want to show some padding to the right of the grid, but there's a nasty
  // firefox bug where the padding isn't shown when the table overflows and
  // we scroll to the right. Adding this `:after` allows us to force the padding
  // that we want.
  // See stackoverflow.com/questions/13471910/no-padding-when-using-overflow-auto
  gridWrapper: {
    display: "flex",
    width: "min-content",
    minWidth: "100%",
    "&:after": {
      content: '""',
      display: "block",
      minWidth: HORIZ_PADDING,
      height: "100%",
    },
  },
  grid: {
    display: "grid",
    color: theme.palette.grey[1000],
    width: "100%",
  },
  loadMore: {
    gridColumn: "1/-1",
  },
});

export const PeopleDirectoryResults = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {
  const {results, resultsLoading, columns, loadMore} = usePeopleDirectory();
  const loadMoreRef = useObserver<HTMLDivElement>({onEnter: loadMore});

  let gridTemplateColumns = "";
  for (const column of columns) {
    if (!column.hideable || !column.hidden) {
      gridTemplateColumns += ` ${column.columnWidth ?? " 1fr"}`;
    }
  }

  const {
    HorizScrollBlock, PeopleDirectoryHeading, PeopleDirectoryResultRow,
    PeopleDirectoryNoResults,
  } = Components;
  if (results.length < 1 && !resultsLoading) {
    return <PeopleDirectoryNoResults />
  }
  return (
    <HorizScrollBlock className={classes.root} contentsClassName={classes.contents}>
      <div className={classes.gridWrapper}>
        <div className={classes.grid} style={{gridTemplateColumns}}>
          {columns.map((column) =>
            !column.hideable || !column.hidden
              ? <PeopleDirectoryHeading key={column.label} column={column} />
              : null
          )}
          {results.map((result) => (
            <PeopleDirectoryResultRow key={result._id} result={result} />
          ))}
          {resultsLoading && Array.from(Array(10).keys()).map((i) => (
            <PeopleDirectoryResultRow key={i} />
          ))}
          {results.length > 0 &&
            <div className={classes.loadMore} ref={loadMoreRef} />
          }
        </div>
      </div>
    </HorizScrollBlock>
  );
}

const PeopleDirectoryResultsComponent = registerComponent(
  "PeopleDirectoryResults",
  PeopleDirectoryResults,
  {styles},
);

declare global {
  interface ComponentTypes {
    PeopleDirectoryResults: typeof PeopleDirectoryResultsComponent
  }
}
