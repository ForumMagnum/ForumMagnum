import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import { Link } from '../../lib/reactRouterWrapper';
import LibraryAddIcon from '@material-ui/icons/LibraryAdd';

const styles = (theme: ThemeType) => ({
  newSequence: {
    color: theme.palette.primary.light
  }
});

export const SequencesNewButton = ({ classes }: {
  classes: ClassesType<typeof styles>
}) => {
  const { SectionButton } = Components
  return  <Link to={"/sequencesnew"}> 
    <SectionButton>
      <LibraryAddIcon />
      Create New Sequence
    </SectionButton>
  </Link>
}

const SequencesNewButtonComponent = registerComponent('SequencesNewButton', SequencesNewButton, {styles});

declare global {
  interface ComponentTypes {
    SequencesNewButton: typeof SequencesNewButtonComponent
  }
}

