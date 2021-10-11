import { registerComponent, Components } from '../../../lib/vulcan-lib';
import React from 'react';
import moment from '../../../lib/moment-timezone';
import Add from '@material-ui/icons/Add';
import AddToCalendar from '@culturehq/add-to-calendar';

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
  post: PostsBase,
  label?: string,
  hideTooltip?: boolean,
  classes: ClassesType,
}) => {
  // need both a start and end time to add an event to a calendar
  if (!post.startTime || !post.endTime) {
    return null;
  }
  
  const calendarIconNode = (
    <AddToCalendar
      event={{
        name: post.title,
        details: post.facebookLink,
        location: post.location,
        startsAt: moment(post.startTime).format(),
        endsAt: moment(post.endTime).format()
      }}>
      <Add className={classes.plusIcon} />
      {label && (
        <span className={classes.label}>
          {label}
        </span>
      )}
    </AddToCalendar>
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
