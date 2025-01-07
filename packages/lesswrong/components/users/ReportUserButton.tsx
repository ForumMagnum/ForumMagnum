import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useDialog } from '../common/withDialog';
import { useCurrentUser } from '../common/withUser';
import { useMessages } from '../common/withMessages';

const styles = (theme: ThemeType) => ({
  reportUserSection: {
    marginTop: 80,
    textAlign: "right",
  },
  reportUserBtn: {
    ...theme.typography.commentStyle,
    ...theme.typography.body2,
    background: 'none',
    color: theme.palette.primary.main,
    padding: 0,
    '&:hover': {
      color: theme.palette.primary.dark,
    }
  },
});

const ReportUserButton = ({user, classes}: {
  user: UsersProfile,
  classes: ClassesType<typeof styles>,
}) => {
  const { openDialog } = useDialog();
  const currentUser = useCurrentUser();
  const { flash } = useMessages()

  const reportUser = () => {
    if (!currentUser) return
    if (!user) return
  
    openDialog({
      componentName: "ReportForm",
      componentProps: {
        reportedUserId: user._id,
        link: `/users/${user.slug}`,
        userId: currentUser._id,
        onSubmit: () => {
          flash({messageString: "Your report has been sent to the moderators"})
        }
      }
    })
  }
  
  const { SingleColumnSection } = Components

  if (currentUser && (currentUser._id !== user._id)) {
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
