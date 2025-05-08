import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import { Link } from '../../lib/reactRouterWrapper';
import LibraryAddIcon from '@/lib/vendor/@material-ui/icons/src/LibraryAdd';

const styles = (theme: ThemeType) => ({
  newSequence: {
    color: theme.palette.primary.light
  }
});

export const SequencesNewButtonInner = ({ classes }: {
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

export const SequencesNewButton = registerComponent('SequencesNewButton', SequencesNewButtonInner, {styles});

declare global {
  interface ComponentTypes {
    SequencesNewButton: typeof SequencesNewButton
  }
}

