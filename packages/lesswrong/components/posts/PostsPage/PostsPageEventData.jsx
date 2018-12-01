import React from 'react'
import { registerComponent, Components } from 'meteor/vulcan:core';
import { withStyles } from '@material-ui/core/styles'
import withUser from '../../common/withUser'

const styles = theme => ({
  metadata: {
    marginTop:theme.spacing.unit*3,
    ...theme.typography.postStyle,
    color: 'rgba(0,0,0,0.5)',
    fontSize: "1.2rem",
  }
})

const PostsPageEventData = ({classes, post, currentUser}) => {
  const { location, contactInfo } = post
  return <div className={classes.metadata}>
      <div className={classes.eventTimes}> <Components.EventTime post={post} dense={false} /> </div>
      { location && <div className={classes.eventLocation}> {location} </div> }
      { contactInfo && <div className={classes.eventContact}> Contact: {contactInfo} </div> }
  </div>
}

registerComponent('PostsPageEventData', PostsPageEventData, withUser, withStyles(styles, {name: "PostsPageEventData"}))
