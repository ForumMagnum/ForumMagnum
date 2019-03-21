import { Components, registerComponent, withList } from 'meteor/vulcan:core';
import React from 'react';
import Sequences from '../../lib/collections/sequences/collection.js';
import { withStyles } from '@material-ui/core/styles';
import { legacyBreakpoints } from '../../lib/modules/utils/theme';

// Shared with SequencesGridWrapper
export const styles = theme => ({
  grid: {
  },

  loadMore: {
    marginTop: theme.spacing.unit,
    marginLeft: 19
  },

  gridContent: {
    marginTop: -15,
    paddingLeft: 5,
    [legacyBreakpoints.maxTiny]: {
      paddingLeft: 0,
    },

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

const SequencesGrid = ({sequences, showAuthor, classes}) =>
  <div className={classes.grid}>
    <div className={classes.gridContent}>
      {sequences.map(sequence => {
        return (
          <Components.SequencesGridItem
            sequence={sequence}
            key={sequence._id}
            showAuthor={showAuthor}/>
        );
      })}
    </div>
  </div>

const options = {
  collection: Sequences,
  queryName: 'SequencesGridQuery',
  fragmentName: 'SequencesPageFragment',
  enableTotal: false,
  enableCache: true,
  ssr: true,
}


registerComponent('SequencesGrid', SequencesGrid, [withList, options],
  withStyles(styles, {name: "SequencesGrid"}));
