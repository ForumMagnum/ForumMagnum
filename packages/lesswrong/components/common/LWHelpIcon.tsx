import React from 'react';
import HelpOutlineIcon from '@material-ui/icons/HelpOutline';
import { registerComponent } from '../../lib/vulcan-lib';

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

const LWHelpIconComponent = registerComponent("LWHelpIcon", LWHelpIcon, {styles});

declare global {
  interface ComponentTypes {
    LWHelpIcon: typeof LWHelpIconComponent
  }
}
