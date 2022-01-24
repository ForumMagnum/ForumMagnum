import { registerComponent, Components } from '../../../lib/vulcan-lib';
import React from 'react';
import moment from '../../../lib/moment-timezone';
import { useTracking } from "../../../lib/analyticsEvents";
import Add from '@material-ui/icons/Add';
import AddToCalendar from '@culturehq/add-to-calendar';
import { useSingle } from '../../../lib/crud/withSingle';

const styles = (theme: ThemeType): JssStyles => ({
  plusIcon: {
    position: 'absolute',
    top: 11,
    left: 11,
    height: 10,
    width: 10,
    backgroundColor: 'white'
  },
  label: {
    marginLeft: 3
  }
})

const AddToCalendarIcon = ({post, label, hideTooltip, classes}: {
  post: PostsList|PostsWithNavigation|PostsWithNavigationAndRevision,
  label?: string,
  hideTooltip?: boolean,
  classes: ClassesType,
}) => {
  const { captureEvent } = useTracking();
  
  // we use the Facebook link as the default event details text
  let eventDetails = post.facebookLink;
  // we try to use plaintextDescription instead if possible
  // (only PostsList should be missing the plaintextDescription, so we pull that in)
  const { document: data } = useSingle({
    collectionName: "Posts",
    fragmentName: 'PostsPlaintextDescription',
    documentId: post._id,
    skip: !post.startTime || !post.contents || ('plaintextDescription' in post.contents)
  });
  
  if (!post.startTime) {
    return null;
  }
  
  if (data) {
    eventDetails = data.contents?.plaintextDescription || eventDetails;
  } else if (post.contents && 'plaintextDescription' in post.contents) {
    eventDetails = post.contents.plaintextDescription || eventDetails;
  }
  
  const endTime = post.endTime ? moment(post.endTime) : moment(post.startTime).add(1, 'hour')
  
  const calendarIconNode = (
    <div onClick={() => captureEvent('addToCalendarClicked')}>
      <AddToCalendar
        event={{
          name: post.title,
          details: eventDetails,
          location: post.onlineEvent ? post.joinEventLink : post.location,
          startsAt: moment(post.startTime).format(),
          endsAt: endTime.format()
        }}>
          <Add className={classes.plusIcon} />
          {label && (
            <span className={classes.label}>
              {label}
            </span>
          )}
      </AddToCalendar>
    </div>
  );
  
  if (hideTooltip) {
    return calendarIconNode;
  }
  
  return (
    <Components.LWTooltip title="Add to calendar" placement="left">
      {calendarIconNode}
    </Components.LWTooltip>
  )
};

const AddToCalendarIconComponent = registerComponent('AddToCalendarIcon', AddToCalendarIcon, {styles});

declare global {
  interface ComponentTypes {
    AddToCalendarIcon: typeof AddToCalendarIconComponent,
  }
}
