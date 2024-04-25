import { Components, registerComponent } from '../../lib/vulcan-lib';
import React from 'react';
import { legacyBreakpoints } from '../../lib/utils/theme';
import range from 'lodash/range';

// Shared with SequencesGridWrapper
export const styles = (theme: ThemeType): JssStyles => ({
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

const SequencesGrid = ({sequences, placeholderCount, showAuthor, classes, bookItemStyle }: {
  sequences: Array<SequencesPageFragment>|null,
  placeholderCount?: number,
  showAuthor?: boolean,
  classes: ClassesType,
  bookItemStyle?: boolean
}) => {
  const { SequencesGridItem } = Components;
  return <div className={classes.grid}>
    <div className={classes.gridContent}>
      {sequences && sequences.map(sequence => <SequencesGridItem
        sequence={sequence}
        key={sequence._id}
        showAuthor={showAuthor}
        bookItemStyle={bookItemStyle}
      />)}
      {!sequences && placeholderCount!==undefined && range(0, placeholderCount)
        .map(i => <SequencesGridItem
          sequence={null}
          placeholder={true}
          key={i}
          showAuthor={showAuthor}
          bookItemStyle={bookItemStyle}
        />)
      }
    </div>
  </div>
}

const SequencesGridComponent = registerComponent('SequencesGrid', SequencesGrid, {styles});

declare global {
  interface ComponentTypes {
    SequencesGrid: typeof SequencesGridComponent
  }
}

