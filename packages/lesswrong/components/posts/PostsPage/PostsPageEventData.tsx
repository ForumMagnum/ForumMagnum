import React from 'react'
import { registerComponent, Components } from '../../../lib/vulcan-lib';
import Typography from '@material-ui/core/Typography'

const styles = (theme: ThemeType): JssStyles => ({
  metadata: {
    marginTop:theme.spacing.unit*3,
    ...theme.typography.postStyle,
    color: 'rgba(0,0,0,0.5)',
  }
})

const PostsPageEventData = ({classes, post}: {
  classes: ClassesType,
  post: PostsBase,
}) => {
  const { location, contactInfo } = post
  return <Typography variant="body2" className={classes.metadata}>
      <div className={classes.eventTimes}> <Components.EventTime post={post} dense={false} /> </div>
      { location && <div className={classes.eventLocation}> {location} </div> }
      { contactInfo && <div className={classes.eventContact}> Contact: {contactInfo} </div> }
  </Typography>
}

const PostsPageEventDataComponent = registerComponent('PostsPageEventData', PostsPageEventData, {styles});

declare global {
  interface ComponentTypes {
    PostsPageEventData: typeof PostsPageEventDataComponent
  }
}
