import React from 'react';
import { Link } from '../../lib/reactRouterWrapper';
import LibraryAddIcon from '@/lib/vendor/@material-ui/icons/src/LibraryAdd';
import SectionButton from "../common/SectionButton";
import { defineStyles } from '@/components/hooks/defineStyles';
import { useStyles } from '@/components/hooks/useStyles';

const styles = defineStyles('SequencesNewButton', (theme: ThemeType) => ({
  newSequence: {
    color: theme.palette.primary.light
  }
}));

export const SequencesNewButton = () => {
  const classes = useStyles(styles);

  return  <Link to={"/sequencesnew"}> 
    <SectionButton>
      <LibraryAddIcon />
      Create New Sequence
    </SectionButton>
  </Link>
}

export default SequencesNewButton;



