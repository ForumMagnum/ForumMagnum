import { Components, registerComponent } from '../../lib/vulcan-lib';
import React from 'react';
import { legacyBreakpoints } from '../../lib/utils/theme';

// Shared with SequencesGridWrapper
export const styles = theme => ({
  grid: {
  },
  gridContent: {
    display: "flex",
    flexDirection: "row",
    flexWrap: "wrap",
    flexFlow: "row wrap",
    justifyContent: "space-between",
    [legacyBreakpoints.maxSmall]: {
      alignItems: "center",
      justifyContent: "center",
    },

    "& a:hover, & a:active": {
      textDecoration: "none",
      color: "rgba(0,0,0,0.87)",
    }
  },
});

const SequencesGrid = ({sequences, showAuthor, classes }: {
  sequences: Array<SequencesPageFragment>,
  showAuthor?: boolean,
  classes: ClassesType
}) =>
  <div className={classes.grid}>
    <div className={classes.gridContent}>
      {sequences.map(sequence => {
        return (
          <Components.SequencesGridItem
            sequence={sequence}
            key={sequence._id}
            showAuthor={showAuthor}
          />
        );
      })}
    </div>
  </div>

const SequencesGridComponent = registerComponent('SequencesGrid', SequencesGrid, {styles});

declare global {
  interface ComponentTypes {
    SequencesGrid: typeof SequencesGridComponent
  }
}

