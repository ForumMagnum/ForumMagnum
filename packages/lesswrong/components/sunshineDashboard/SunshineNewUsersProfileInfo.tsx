import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import React, { useState } from 'react';
import { useSingle } from '../../lib/crud/withSingle';
import { useCurrentUser } from '../common/withUser';
import { userCanDo } from '../../lib/vulcan-users/permissions';
import { preferredHeadingCase } from '../../themes/forumTheme';
import DeferRender from '../common/DeferRender';

const styles = (theme: ThemeType) => ({
  root: {
    backgroundColor: theme.palette.grey[50],
    padding: 12,
    border: theme.palette.border.faint,
    borderRadius: theme.borderRadius.default,
  }
})

const SunshineNewUsersProfileInfo = ({userId, classes}: {userId: string, classes: ClassesType<typeof styles>}) => {
  const [expanded, setExpanded] = useState(false);
  const currentUser = useCurrentUser()

  const { SunshineNewUsersInfo, SectionButton } = Components

  const { document: user, refetch } = useSingle({
    documentId:userId,
    collectionName: "Users",
    fragmentName: 'SunshineUsersList',
  });

  if (!user) return null

  if (!currentUser || !userCanDo(currentUser, 'posts.moderate.all')) return null
  
  if (user.reviewedByUserId && !user.snoozedUntilContentCount && !expanded) {
    return <div className={classes.root} onClick={() => setExpanded(true)}>
      <SectionButton>{preferredHeadingCase("Expand Moderation Tools")}</SectionButton>
    </div>
  }
  
  return <div className={classes.root}>
    <DeferRender ssr={false}>
      <SunshineNewUsersInfo user={user} currentUser={currentUser} refetch={refetch}/>
    </DeferRender>
  </div>
}

const SunshineNewUsersProfileInfoComponent = registerComponent('SunshineNewUsersProfileInfo', SunshineNewUsersProfileInfo, {styles});

declare global {
  interface ComponentTypes {
    SunshineNewUsersProfileInfo: typeof SunshineNewUsersProfileInfoComponent
  }
}
