import React, { useState } from 'react';
import { useCurrentUser } from '../common/withUser';
import { userIsAdminOrMod } from '../../lib/vulcan-users/permissions';
import { preferredHeadingCase } from '../../themes/forumTheme';
import DeferRender from '../common/DeferRender';
import { useQuery } from "@/lib/crud/useQuery";
import { gql } from "@/lib/generated/gql-codegen";
import SunshineNewUsersInfo from "./SunshineNewUsersInfo";
import SectionButton from "../common/SectionButton";
import { defineStyles, useStyles } from '../hooks/useStyles';

const SunshineUsersListQuery = gql(`
  query SunshineNewUsersProfileInfo($documentId: String) {
    user(input: { selector: { documentId: $documentId } }) {
      result {
        ...SunshineUsersList
      }
    }
  }
`);

const styles = defineStyles("SunshineNewUsersProfileInfo", (theme: ThemeType) => ({
  root: {
    backgroundColor: theme.palette.grey[50],
    padding: 12,
    border: theme.palette.border.faint,
    borderRadius: theme.borderRadius.default,
  }
}))

const SunshineNewUsersProfileInfo = ({userId}: {userId: string}) => {
  const currentUser = useCurrentUser()
  if (!currentUser || !userIsAdminOrMod(currentUser)) {
    return null
  }
  
  return <SunshineNewUsersProfileInfoInner userId={userId}/>
}

const SunshineNewUsersProfileInfoInner = ({userId}: {userId: string}) => {
  const classes = useStyles(styles);
  const [expanded, setExpanded] = useState(false);
  const currentUser = useCurrentUser()

  const { refetch, data } = useQuery(SunshineUsersListQuery, {
    variables: { documentId: userId },
  });
  const user = data?.user?.result;
  if (!user) return null
  if (!currentUser) return null;

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

export default SunshineNewUsersProfileInfo;


