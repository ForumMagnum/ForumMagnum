import React from 'react'
import { Components, registerComponent } from 'meteor/vulcan:core'
import { withStyles, createStyles } from '@material-ui/core/styles'
import Typography from '@material-ui/core/Typography'
import { withCookies } from 'react-cookie'
import { withMessages } from '../common/withMessages';


const styles = createStyles(theme => ({
  root: {
    minHeight: 300,
    backgroundImage: `url(https://images.pexels.com/photos/414171/pexels-photo-414171.jpeg?auto=compress&cs=tinysrgb&dpr=2&w=500)`,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center'
  },
  dismissRoot: {
    textAlign: 'right',
    color: '#999'
  }
}))

const COOKIE_NAME = 'hide_home_handbook'
const END_OF_TIME = new Date('2038-01-18')
const EAHomeHandbook = ({ classes, cookies, flash }) => {
  const { SingleColumnSection } = Components
  const hideHandbook = cookies.get(COOKIE_NAME)
  if (hideHandbook) return null

  const handleDismiss = () => {
    cookies.set(COOKIE_NAME, 'true', {
      expires: END_OF_TIME
    })
    flash({
      messageString: `We won't show this again. If you want to read the Handbook, you can access it from the sidebar menu.`
    })
  }

  return <SingleColumnSection>
    <div className={classes.root}>
      <Typography variant='display2'>EA Handbook</Typography>
    </div>
    <div className={classes.dismissRoot}>
      <Typography>
        <a onClick={handleDismiss}>Don't show this</a>
      </Typography>
    </div>
  </SingleColumnSection>
}
registerComponent('EAHomeHandbook', EAHomeHandbook, withStyles(styles, { name: 'EAHomeHandbook' }), withCookies, withMessages)
