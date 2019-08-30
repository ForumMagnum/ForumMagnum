import React from 'react'
import { registerComponent, Components } from 'meteor/vulcan:core';
import { withStyles } from '@material-ui/core/styles'
import withUser from '../../common/withUser'
import Typography from '@material-ui/core/Typography'

const styles = theme => ({
  metadata: {
    marginTop:theme.spacing.unit*3,
    ...theme.typography.postStyle,
    color: 'rgba(0,0,0,0.5)',
  }
})

const PostsPageEventData = ({classes, post, currentUser}) => {
  const { location, contactInfo } = post
  return <Typography variant="body1" className={classes.metadata}>
      <div className={classes.eventTimes}> <Components.EventTime post={post} dense={false} /> </div>
      { location && <div className={classes.eventLocation}> {location} </div> }
      { contactInfo && <div className={classes.eventContact}> Contact: {contactInfo} </div> }
  </Typography>
}

registerComponent('PostsPageEventData', PostsPageEventData, withUser, withStyles(styles, {name: "PostsPageEventData"}))
