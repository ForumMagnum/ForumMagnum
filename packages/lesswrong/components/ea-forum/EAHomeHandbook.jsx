import React from 'react'
import { Components, registerComponent } from 'meteor/vulcan:core'
import { withStyles, createStyles } from '@material-ui/core/styles'
import { withSingle } from '../../lib/crud/withSingle';
import Typography from '@material-ui/core/Typography'
import { withCookies } from 'react-cookie'
import { withMessages } from '../common/withMessages';
import Sequences from '../../lib/collections/sequences/collection';

const styles = createStyles(theme => ({
  imgWrapper: {
    // TODO; full width
    position: 'absolute',
    right: 0,
    top: 77, // header height
    width: "100vw",
    height: 400,
    "& img": { // TODO;
      width: "100vw",
    },
    // minHeight: 400,
    // width: '100%',
    // backgroundColor: '#999999',
  },
  overImage: {
    marginTop: -36, // Undo layout main
    minHeight: 400,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
    position: 'relative',
  },
  overImageText: {
    ...theme.typography.display2,
    color: '#FFFFFF',
    marginTop: 0,
  },
  dismiss: {
    // hack
    fontFamily: theme.typography.uiSecondary.fontFamily,
    fontSize: 14,
    marginTop: -27,
    textAlign: 'right',
    color: '#BBB',
    position: 'relative',
    zIndex: 1,
  },
}))

const COOKIE_NAME = 'hide_home_handbook'
const END_OF_TIME = new Date('2038-01-18')

const EAHomeHandbook = ({ classes, cookies, flash, document, loading }) => {
  const { SingleColumnSection, CloudinaryImage2, Loading } = Components
  const hideHandbook = cookies.get(COOKIE_NAME)
  if (hideHandbook) return null
  if (loading || !document) return <Loading />

  const handleDismiss = () => {
    cookies.set(COOKIE_NAME, 'true', {
      expires: END_OF_TIME
    })
    flash({
      messageString: `We won't show this again. If you want to read the Handbook, you can access it from the sidebar menu.`
    })
  }

  return <React.Fragment>
    <SingleColumnSection>
      <div className={classes.imgWrapper}>
        <CloudinaryImage2
          publicId={document.bannerImageId}
          width="auto"
          height="400"
        />
      </div>
      <div className={classes.overImage}>
        <div className={classes.overImageText}>EA Handbook</div>
      </div>
      <div className={classes.dismiss}>
        <a onClick={handleDismiss}>Don't show this</a>
      </div>
    </SingleColumnSection>
  </React.Fragment>
}

const options = {
  collection: Sequences,
  queryName: "SequencesPageQuery",
  fragmentName: 'SequencesPageFragment',
  enableTotal: false,
  ssr: true,
};

registerComponent(
  'EAHomeHandbook', EAHomeHandbook,
  withStyles(styles, { name: 'EAHomeHandbook' }),
  withCookies, withMessages, [withSingle, options]
)
