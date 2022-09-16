import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useMessages } from '../common/withMessages';
import { useCurrentUser } from '../common/withUser';
import { useDialog } from '../common/withDialog';
import Button from '@material-ui/core/Button';
import classNames from 'classnames';
import { useTracking } from "../../lib/analyticsEvents";
import { useSubscribeUserToTag } from '../../lib/filterSettings';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    display: "flex",
    alignItems: "center",
    padding: 7,
    justifyContent: "space-around",
    backgroundColor: theme.palette.grey[100],
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
  className,
  classes,
}: {
  tag: TagBasicInfo,
  className?: string,
  classes: ClassesType,
}) => {
  const currentUser = useCurrentUser();
  const { openDialog } = useDialog();
  const { subscribeUserToTag } = useSubscribeUserToTag(tag)
  const { flash } = useMessages();
  const { captureEvent } = useTracking()
  const { LWTooltip } = Components

  const onSubscribe = async (e: React.MouseEvent<HTMLButtonElement>) => {
    try {
      e.preventDefault();

      const newMode = "Subscribed";
      captureEvent('subforumSubscribeClicked', {tagId: tag._id, newMode});

      if (currentUser) {
        subscribeUserToTag(tag, newMode);
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

  return <div className={classNames(className, classes.root)}>
    <LWTooltip title={`Join to gain comment access and see ${tag.name} Subforum content on the frontpage`}>
      <Button variant="contained" color="primary" className={classes.subscribeButton} onClick={onSubscribe}>
        <span className={classes.subscribeText}>{`Join`}</span>
      </Button>
    </LWTooltip>
  </div>
}

const SubforumSubscribeSectionComponent = registerComponent('SubforumSubscribeSection', SubforumSubscribeSection, {styles, stylePriority: 1});

declare global {
  interface ComponentTypes {
    SubforumSubscribeSection: typeof SubforumSubscribeSectionComponent
  }
}
