import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';

const styles = (theme: ThemeType) => ({
  root: {
    display: 'flex',
    justifyContent: 'space-between',
    columnGap: 8,
    fontFamily: theme.typography.commentStyle.fontFamily,
    color: theme.palette.text.warning,
    fontSize: 14,
    lineHeight: '20px',
    fontWeight: '500',
    padding: '10px 8px',
    borderRadius: 4,
    backgroundColor: theme.palette.background.warningTranslucent,
    marginBottom: 8,
  },
  icon: {
    transform: "translateY(3px)",
    fontSize: 16,
  },
  message: {
    flexGrow: 1,
    '& a': {
      textDecoration: 'underline',
    }
  },
});

const WarningBannerInner = ({message, classes}: {
  message: string,
  classes: ClassesType<typeof styles>,
}) => {
  
  return <div className={classes.root}>
    <Components.ForumIcon icon="Warning" className={classes.icon} />
    <div className={classes.message} dangerouslySetInnerHTML={{__html: message}} />
  </div>
}

export const WarningBanner = registerComponent('WarningBanner', WarningBannerInner, {styles});

declare global {
  interface ComponentTypes {
    WarningBanner: typeof WarningBanner
  }
}
