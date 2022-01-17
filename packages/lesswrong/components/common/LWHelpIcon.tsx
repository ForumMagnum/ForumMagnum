import React from 'react';
import HelpIcon from '@material-ui/icons/Help';
import { registerComponent } from '../../lib/vulcan-lib';

const styles = (theme) => ({
  icon: {
    height: 18,
    position: "relative",
    top: 2, // seems to be necessary so that it lines up nicely with text, might revisit this if it looks weird next to other text sizes
    color: theme.palette.grey[500]
  }
})

const LWHelpIcon = ({classes}:{classes:ClassesType}) => {
  return <span><HelpIcon className={classes.icon}/></span>
}

const LWHelpIconComponent = registerComponent("LWHelpIcon", LWHelpIcon, {styles});

declare global {
  interface ComponentTypes {
    LWHelpIcon: typeof LWHelpIconComponent
  }
}
