import { Components, registerComponent } from 'meteor/vulcan:core';
import React from 'react';
import { withStyles } from '@material-ui/core/styles';
import { legacyBreakpoints } from '../../lib/modules/utils/theme';

// Shared with SequencesGridWrapper
export const styles = theme => ({
  grid: {
  },

  loadMore: {
    marginTop: theme.spacing.unit,
  },

  gridContent: {
    marginLeft: -15,
    marginRight: -24,
    [theme.breakpoints.down('md')]: {
      marginLeft: 0,
      marginRight: 0
    },
    paddingRight: 6,
    [legacyBreakpoints.maxTiny]: {
      paddingLeft: 0,
    },

    display: "flex",
    flexDirection: "row",
    flexWrap: "wrap",
    flexFlow: "row wrap",
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

registerComponent('SequencesGrid', SequencesGrid,
  withStyles(styles, {name: "SequencesGrid"}));
