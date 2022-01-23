import React from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import { Link } from '../../lib/reactRouterWrapper';
import LibraryAddIcon from '@material-ui/icons/LibraryAdd';

const styles = (theme: ThemeType): JssStyles => ({
  newSequence: {
    color: 'var(--color-primary-light)'
  }
});

export const SequencesNewButton = ({ classes }: {
  classes: ClassesType
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
