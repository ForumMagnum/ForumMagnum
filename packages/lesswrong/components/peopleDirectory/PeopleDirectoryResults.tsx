import React from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib";
import { usePeopleDirectory } from "./usePeopleDirectory";
import { SCROLL_INDICATOR_SIZE } from "../common/HorizScrollBlock";

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
  },
  loading: {
    gridColumn: "1/-1",
    margin: 12,
  },
});

export const PeopleDirectoryResults = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {
  const {results, resultsLoading, columns} = usePeopleDirectory();
  const columnCount = columns
    .filter((column) => !column.hideable || !column.hidden)
    .length;

  const {
    HorizScrollBlock, PeopleDirectoryHeading, PeopleDirectoryResultRow, Loading,
  } = Components;
  return (
    <HorizScrollBlock className={classes.root} contentsClassName={classes.contents}>
      <div className={classes.gridWrapper}>
      <div
        style={{
          gridTemplateColumns: `repeat(${columnCount}, 1fr)`,
        }}
        className={classes.grid}
      >
        {columns.map((column) =>
          !column.hideable || !column.hidden
            ? <PeopleDirectoryHeading key={column.label} column={column} />
            : null
        )}
        {results.map((result) => (
          <PeopleDirectoryResultRow key={result._id} result={result} />
        ))}
        {resultsLoading &&
          <div className={classes.loading}>
            <Loading />
          </div>
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
