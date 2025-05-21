import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import ForumIcon from "./ForumIcon";

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

const WarningBanner = ({message, classes}: {
  message: string,
  classes: ClassesType<typeof styles>,
}) => {
  
  return <div className={classes.root}>
    <ForumIcon icon="Warning" className={classes.icon} />
    <div className={classes.message} dangerouslySetInnerHTML={{__html: message}} />
  </div>
}

export default registerComponent('WarningBanner', WarningBanner, {styles});


