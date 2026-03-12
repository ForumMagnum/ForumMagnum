import React from 'react';
import { useDialog } from '../common/withDialog';
import { useCurrentUser } from '../common/withUser';
import { useMessages } from '../common/withMessages';
import ReportForm from "../sunshineDashboard/ReportForm";
import SingleColumnSection from "../common/SingleColumnSection";
import { defineStyles } from '@/components/hooks/defineStyles';
import { useStyles } from '@/components/hooks/useStyles';

const styles = defineStyles("ReportUserButton", (theme: ThemeType) => ({
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
}));

const ReportUserButton = ({user}: {
  user: UsersProfile,
}) => {
  const classes = useStyles(styles);
  const { openDialog } = useDialog();
  const currentUser = useCurrentUser();
  const { flash } = useMessages()

  const reportUser = () => {
    if (!currentUser) return
    if (!user) return
  
    openDialog({
      name: "ReportForm",
      contents: ({onClose}) => <ReportForm
        onClose={onClose}
        reportedUserId={user._id}
        link={`/users/${user.slug}`}
        userId={currentUser._id}
        onSubmit={() => {
          flash({messageString: "Your report has been sent to the moderators"})
        }}
      />,
    })
  }
  if (currentUser && (currentUser._id !== user._id)) {
    return <SingleColumnSection className={classes.reportUserSection}>
      <button className={classes.reportUserBtn} onClick={reportUser}>Report user</button>
    </SingleColumnSection>
  } else {
    return null;
  }
}

export default ReportUserButton;

