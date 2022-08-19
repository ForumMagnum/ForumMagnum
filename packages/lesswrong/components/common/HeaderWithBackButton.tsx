import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib';
import Headroom from '../../lib/react-headroom'
import Toolbar from '@material-ui/core/Toolbar';
import ArrowBackIcon from '@material-ui/icons/ArrowBack';
import { styles } from './Header';
import IconButton from '@material-ui/core/IconButton';
import { forumTypeSetting } from '../../lib/instanceSettings';
import { withTheme } from '@material-ui/core/styles';

// An alternate variation of the site header where all the usual stuff (menu
// icon, search, notifications, etc) is replaced with a back button and a label.
// This is used for drilldown menus (ie the account settings page), on small
// screens only.
const HeaderWithBackButton = ({label, onBack, theme, classes}: {
  label: string,
  onBack: ()=>void,
  theme?: ThemeType,
  classes,
}) => {
  return <Headroom>
    <header className={classes.appBar}>
      <Toolbar disableGutters={forumTypeSetting.get() === 'EAForum'}>
        <IconButton className={classes.menuButton} color="inherit" aria-label="Back" onClick={onBack}>
          <ArrowBackIcon />
        </IconButton>
        <div className={classes.titleLink}>
          {label}
        </div>
      </Toolbar>
    </header>
  </Headroom>
}

const HeaderWithBackButtonComponent = registerComponent('HeaderWithBackButton', HeaderWithBackButton, {
  styles, hocs: [withTheme()]
});

declare global {
  interface ComponentTypes {
    HeaderWithBackButton: typeof HeaderWithBackButtonComponent
  }
}
