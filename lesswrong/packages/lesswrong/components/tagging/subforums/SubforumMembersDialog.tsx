import React from 'react';
import { Components, registerComponent } from '../../../lib/vulcan-lib';
import { useMulti } from '../../../lib/crud/withMulti';
import DialogContent from '@material-ui/core/DialogContent';

const styles = (theme: ThemeType) => ({
  titleRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    columnGap: 14,
    padding: '0 24px',
  },
  title: {
    fontFamily: theme.typography.postStyle.fontFamily,
    fontSize: 20,
    lineHeight: '26px',
    fontWeight: 400,
    textTransform: 'capitalize'
  },
  joinBtn: {
    '& button': {
      minHeight: 0,
      fontSize: 12,
      padding: 6
    }
  },
  user: {
    marginBottom: 20
  }
})

const SubforumMembersDialog = ({classes, onClose, tag}: {
  classes: ClassesType<typeof styles>,
  onClose: () => void,
  tag: TagSubforumFragment,
}) => {
  const { results: members, loading } = useMulti({
    terms: {view: 'tagCommunityMembers', profileTagId: tag?._id, limit: 100},
    collectionName: 'Users',
    fragmentName: 'UsersProfile',
    skip: !tag
  })
  
  const organizers: UsersProfile[] = []
  const otherMembers: UsersProfile[] = []
  members?.forEach(member => {
    if (tag.subforumModeratorIds?.includes(member._id)) {
      organizers.push(member)
    } else {
      otherMembers.push(member)
    }
  })
  
  const { LWDialog, SubforumSubscribeSection, SubforumMember, Loading } = Components
  
  return (
    <LWDialog open={true} onClose={onClose}>
      <h2 className={classes.titleRow}>
        <div className={classes.title}>Members{members ? ` (${members.length})` : ''}</div>
        <SubforumSubscribeSection tag={tag} className={classes.joinBtn} />
      </h2>
      <DialogContent>
        {loading && <Loading />}
        {organizers?.map(user => {
          return <div key={user._id} className={classes.user}>
            <SubforumMember user={user} isOrganizer />
          </div>
        })}
        {otherMembers?.map(user => {
          return <div key={user._id} className={classes.user}>
            <SubforumMember user={user} />
          </div>
        })}
      </DialogContent>
    </LWDialog>
  )
}

const SubforumMembersDialogComponent = registerComponent('SubforumMembersDialog', SubforumMembersDialog, { styles })

declare global {
  interface ComponentTypes {
    SubforumMembersDialog: typeof SubforumMembersDialogComponent
  }
}
