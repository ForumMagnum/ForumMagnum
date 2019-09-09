import React from 'react';
import { registerComponent, Components } from 'meteor/vulcan:core';
import { withStyles } from '@material-ui/core/styles';
import { Link } from '../../lib/reactRouterWrapper.js';
import LibraryAddIcon from '@material-ui/icons/LibraryAdd';

const styles = theme => ({
  newSequence: {
    color: theme.palette.primary.light
  }
});

export const SequencesNewButton = ({ classes }) => {
  const { SectionButton } = Components
  return  <Link to={"/sequencesnew"}> 
    <SectionButton>
      <LibraryAddIcon />
      Create New Sequence
    </SectionButton>
  </Link>
}

registerComponent('SequencesNewButton', SequencesNewButton, withStyles(styles, { name: "SequencesNewButton" }));
