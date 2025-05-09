import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { Link } from '../../lib/reactRouterWrapper';
import LibraryAddIcon from '@/lib/vendor/@material-ui/icons/src/LibraryAdd';
import { SectionButton } from "../common/SectionButton";

const styles = (theme: ThemeType) => ({
  newSequence: {
    color: theme.palette.primary.light
  }
});

export const SequencesNewButtonInner = ({ classes }: {
  classes: ClassesType<typeof styles>
}) => {
  return  <Link to={"/sequencesnew"}> 
    <SectionButton>
      <LibraryAddIcon />
      Create New Sequence
    </SectionButton>
  </Link>
}

export const SequencesNewButton = registerComponent('SequencesNewButton', SequencesNewButtonInner, {styles});



