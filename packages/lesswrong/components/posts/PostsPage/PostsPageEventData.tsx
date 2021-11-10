import React from 'react'
import { registerComponent, Components } from '../../../lib/vulcan-lib';

const styles = (theme: ThemeType): JssStyles => ({
  metadata: {
    marginTop:theme.spacing.unit*2,
    ...theme.typography.postStyle,
    color: 'rgba(0,0,0,0.5)',
  },
})

const PostsPageEventData = ({classes, post}: {
  classes: ClassesType,
  post: PostsBase,
}) => {
  const { location, contactInfo, onlineEvent } = post
  
  const locationNode = onlineEvent ? (
    <div className={classes.eventLocation}>Online Event</div>
  ) : (location && <div className={classes.eventLocation}> {location} </div>);
  
  return <Components.Typography variant="body2" className={classes.metadata}>
      <div className={classes.eventTimes}> <Components.EventTime post={post} dense={false} /> </div>
      { locationNode }
      { contactInfo && <div className={classes.eventContact}> Contact: {contactInfo} </div> }
  </Components.Typography>
}

const PostsPageEventDataComponent = registerComponent('PostsPageEventData', PostsPageEventData, {styles});

declare global {
  interface ComponentTypes {
    PostsPageEventData: typeof PostsPageEventDataComponent
  }
}
