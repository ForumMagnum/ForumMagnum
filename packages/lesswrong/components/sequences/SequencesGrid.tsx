import { registerComponent } from '../../lib/vulcan-lib/components';
import React from 'react';
import { legacyBreakpoints } from '../../lib/utils/theme';
import { SequencesGridItem } from "./SequencesGridItem";

// Shared with SequencesGridWrapper
export const styles = (theme: ThemeType) => ({
  grid: {
    marginBottom: 10,
  },
  gridContent: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: "10px",

    [legacyBreakpoints.maxSmall]: {
      gridTemplateColumns: "1fr",
      maxWidth: "max-content",
      margin: "0 auto",
    },

    "& a:hover, & a:active": {
      textDecoration: "none",
      color: theme.palette.link.unmarked,
    }
  },
  noResults: {
    marginLeft: theme.spacing.unit,
    color: theme.palette.text.dim4,
    ...theme.typography.italic,
  }
});

const SequencesGridInner = ({sequences, showAuthor, classes, bookItemStyle }: {
  sequences: Array<SequencesPageFragment>,
  showAuthor?: boolean,
  classes: ClassesType<typeof styles>,
  bookItemStyle?: boolean
}) =>
  <div className={classes.grid}>
    <div className={classes.gridContent}>
      {sequences.map(sequence => {
        return (
          <SequencesGridItem
            sequence={sequence}
            key={sequence._id}
            showAuthor={showAuthor}
            bookItemStyle={bookItemStyle}
          />
        );
      })}
    </div>
  </div>

export const SequencesGrid = registerComponent('SequencesGrid', SequencesGridInner, {styles});



