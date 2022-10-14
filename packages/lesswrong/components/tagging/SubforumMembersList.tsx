import Button from '@material-ui/core/Button';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import React from 'react';
import { Link } from '../../lib/reactRouterWrapper';
import { useNewEvents } from '../../lib/events/withNewEvents';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useUpdateCurrentUser } from '../hooks/useUpdateCurrentUser';

const styles = (theme: ThemeType): JssStyles => ({
  moderationGuidelines: {
    ...theme.typography.body2,
    fontFamily: theme.typography.postStyle.fontFamily,
    '& a': {
      color: theme.palette.primary.main,
    }
  }
});

const SubforumMembersList = ({classes, onClose, tag, members}: {
  classes: ClassesType,
  onClose: () => void,
  tag: TagBasicInfo,
  members: Array<UsersProfile>
}) => {
  const { LWDialog } = Components
  const updateCurrentUser = useUpdateCurrentUser()
  const { recordEvent } = useNewEvents()

  // const handleClick = () => {
  //   void updateCurrentUser({
  //     acknowledgedNewUserGuidelines: true
  //   });

  //   const eventProperties = {
  //     userId: user._id,
  //     important: false,
  //     intercom: true,
  //     documentId: post._id,
  //   };

  //   recordEvent('acknowledged-new-user-guidelines', false, eventProperties);

  //   onClose();
  // }
  
  return (
    <LWDialog open={true} onClose={onClose}>
      <DialogTitle>{tag.name} Subforum Members</DialogTitle>
      <DialogContent>
        {members.map(user => {
          return <div key={user._id}>
            {user.displayName}
          </div>
        })}
      </DialogContent>
      <DialogActions>
        <Button onClick={() => {}}>
          Join
        </Button>
      </DialogActions>
    </LWDialog>
  )
};

const SubforumMembersListComponent = registerComponent('SubforumMembersList', SubforumMembersList, { styles });

declare global {
  interface ComponentTypes {
    SubforumMembersList: typeof SubforumMembersListComponent
  }
}
