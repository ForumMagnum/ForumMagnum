import React from 'react';
import { useMessages } from '../../common/withMessages';
import { useCurrentUser } from '../../common/withUser';
import { useDialog } from '../../common/withDialog';
import Button from '@material-ui/core/Button';
import classNames from 'classnames';
import { useTracking } from "../../../lib/analyticsEvents";
import { gql, useMutation } from '@apollo/client';
import { Components, registerComponent } from "../../../lib/vulcan-lib/components";
import { getFragment } from "../../../lib/vulcan-lib/fragments";
import LWTooltip from "@/components/common/LWTooltip";

const styles = (_theme: ThemeType) => ({
  root: {
    display: "flex",
    alignItems: "center",
    padding: 7,
    justifyContent: "space-around",
    backgroundColor: 'transparent'
  },
  subscribeButton: {
    textTransform: 'none',
    fontSize: 16,
    boxShadow: 'none',
    paddingLeft: 24,
    paddingRight: 24,
  }
})

const SubforumSubscribeSection = ({
  tag,
  joinCallback = () => {},
  leaveCallback = () => {},
  className,
  classes,
}: {
  tag: TagBasicInfo,
  joinCallback?: () => void,
  leaveCallback?: () => void,
  className?: string,
  classes: ClassesType<typeof styles>,
}) => {
  const currentUser = useCurrentUser();
  const { openDialog } = useDialog();
  const { flash } = useMessages();
  const { captureEvent } = useTracking()
  const [subforumMembershipMutation] = useMutation(gql`
    mutation UserUpdateSubforumMembership($tagId: String!, $member: Boolean!) {
      UserUpdateSubforumMembership(tagId: $tagId, member: $member) {
        ...UsersCurrent
      }
    }
    ${getFragment("UsersCurrent")}
  `, {refetchQueries: ['getCurrentUser']});
  const onSubscribe = async (e: React.MouseEvent<HTMLButtonElement>) => {
    try {
      e.preventDefault();

      captureEvent('subforumSubscribeClicked', {tagId: tag._id});

      if (currentUser) {
        joinCallback();
        await subforumMembershipMutation({variables: {tagId: tag._id, member: true}});
      } else {
        openDialog({
          componentName: "LoginPopup",
          componentProps: {}
        });
      }
    } catch(error) {
      flash({messageString: error.message});
    }
  }
  
  const onUnsubscribe = async (e: React.MouseEvent<HTMLButtonElement>) => {
    try {
      e.preventDefault()

      captureEvent('subforumUnsubscribeClicked', {tagId: tag._id})
      if (currentUser) {
        leaveCallback();
        await subforumMembershipMutation({variables: {tagId: tag._id, member: false}});
      }
    } catch(error) {
      flash({messageString: error.message});
    }
  }
  
  const isSubscribed = currentUser?.profileTagIds?.includes(tag._id)

  return <div className={classNames(className, classes.root)}>
    {isSubscribed ? <Button variant="outlined" color="primary" className={classes.subscribeButton} onClick={onUnsubscribe}>
      <span>Leave</span>
    </Button> : <LWTooltip title={`Join to gain comment access and see ${tag.name} Subforum content on the frontpage`}>
      <Button variant="contained" color="primary" className={classes.subscribeButton} onClick={onSubscribe}>
        <span>Join</span>
      </Button>
    </LWTooltip>}
  </div>
}

const SubforumSubscribeSectionComponent = registerComponent('SubforumSubscribeSection', SubforumSubscribeSection, {styles, stylePriority: 1});

declare global {
  interface ComponentTypes {
    SubforumSubscribeSection: typeof SubforumSubscribeSectionComponent
  }
}

export default SubforumSubscribeSectionComponent;
