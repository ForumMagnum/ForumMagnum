import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    display: 'flex',
    justifyContent: 'space-between',
    columnGap: 8,
    fontFamily: theme.typography.commentStyle.fontFamily,
    color: theme.palette.text.warning,
    fontSize: 14,
    lineHeight: '18px',
    fontWeight: '500',
    padding: '10px 8px',
    borderRadius: 4,
    backgroundColor: theme.palette.background.warningTranslucent,
    marginBottom: 8,
  },
  icon: {
    transform: "translateY(1px)",
    fontSize: 16,
  },
  message: {
    flexGrow: 1
  }
});

const WarningBanner = ({message, classes}: {
  message: string,
  classes: ClassesType,
}) => {
  
  return <div className={classes.root}>
    <Components.ForumIcon icon="Warning" className={classes.icon} />
    <div className={classes.message}>
      {message}
    </div>
  </div>
}

const WarningBannerComponent = registerComponent('WarningBanner', WarningBanner, {styles});

declare global {
  interface ComponentTypes {
    WarningBanner: typeof WarningBannerComponent
  }
}
