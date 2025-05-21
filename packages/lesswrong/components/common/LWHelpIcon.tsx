import React from 'react';
import HelpOutlineIcon from '@/lib/vendor/@material-ui/icons/src/HelpOutline';
import { registerComponent } from '../../lib/vulcan-lib/components';

const styles = (theme: ThemeType) => ({
  icon: {
    fontSize: "1.3em",
    width: "1.5em",
    position: "relative",
    top: ".19em", // seems to be necessary so that it lines up nicely with text, might revisit this if it looks weird next to other text sizes
    color: theme.palette.grey[500]
  }
})

const LWHelpIcon = ({classes}: {classes: ClassesType<typeof styles>}) => {
  return <span><HelpOutlineIcon className={classes.icon}/></span>
}

export default registerComponent("LWHelpIcon", LWHelpIcon, {styles});


