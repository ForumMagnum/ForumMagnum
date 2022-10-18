import Button from '@material-ui/core/Button';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import React from 'react';
import { Link } from '../../lib/reactRouterWrapper';
import { useNewEvents } from '../../lib/events/withNewEvents';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useUpdateCurrentUser } from '../hooks/useUpdateCurrentUser';
import { useCurrentUser } from '../common/withUser';
import { useMulti } from '../../lib/crud/withMulti';

const styles = (theme: ThemeType): JssStyles => ({
  titleRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    columnGap: 20,
    flexWrap: 'wrap',
    padding: '12px 24px 20px'
  },
  title: {
    fontFamily: theme.typography.postStyle.fontFamily,
    fontSize: 22,
    fontWeight: 400
  },
  joinBtn: {
    '& button': {
      minHeight: 0,
      fontSize: 12,
      padding: 6
    }
  },
  user: {
    borderBottom: theme.palette.border.extraFaint
  }
})

const SubforumMembersDialog = ({classes, onClose, tag}: {
  classes: ClassesType,
  onClose: () => void,
  tag: TagBasicInfo,
}) => {
  const { results: members } = useMulti({
    terms: {view: 'tagCommunityMembers', profileTagId: tag?._id, limit: 50},
    collectionName: 'Users',
    fragmentName: 'UsersProfile',
    skip: !tag
  })
  
  const { LWDialog, CommunityMemberCard, SubforumSubscribeSection } = Components
  
  return (
    <LWDialog open={true} onClose={onClose}>
      <h2 className={classes.titleRow}>
        <div className={classes.title}>{tag.name} Subforum Members</div>
        <SubforumSubscribeSection tag={tag} className={classes.joinBtn} />
      </h2>
      <DialogContent>
        {members?.map(user => {
          return <div key={user._id} className={classes.user}>
            <CommunityMemberCard user={user} />
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
