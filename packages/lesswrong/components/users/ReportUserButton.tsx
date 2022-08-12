import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useDialog } from '../common/withDialog';
import { useCurrentUser } from '../common/withUser';
import { useMessages } from '../common/withMessages';

const styles = (theme: ThemeType): JssStyles => ({
  reportUserSection: {
    marginTop: 60
  },
  reportUserBtn: {
    ...theme.typography.commentStyle,
    background: 'none',
    color: theme.palette.primary.main,
    fontSize: 13,
    padding: 0,
    '&:hover': {
      color: theme.palette.primary.dark,
    }
  },
});

const ReportUserButton = ({user, classes}: {
  user: UsersProfile,
  classes: ClassesType,
}) => {
  const { openDialog } = useDialog();
  const currentUser = useCurrentUser();
  const { SingleColumnSection } = Components;

  const { flash } = useMessages()
  const reportUser = async () => {
    if (!currentUser) return;
    if (!user) return
    openDialog({
      componentName: "ReportForm",
      componentProps: {
        reportedUserId: user._id,
        link: `/users/${user.slug}`,
        userId: currentUser._id,
        onClose: () => {
          flash({messageString: "Your report has been sent to the moderators"})
        }
      }
    });
  }

  if (currentUser && user.karma < 50 && (currentUser._id !== user._id)) {
    return <SingleColumnSection className={classes.reportUserSection}>
      <button className={classes.reportUserBtn} onClick={reportUser}>Report user</button>
    </SingleColumnSection>
  } else {
    return null;
  }
}

const ReportUserButtonComponent = registerComponent('ReportUserButton', ReportUserButton, {styles});

declare global {
  interface ComponentTypes {
    ReportUserButton: typeof ReportUserButtonComponent
  }
}
