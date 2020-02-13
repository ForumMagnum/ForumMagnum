// TODO; tsx
import React from 'react'
import { Components, registerComponent } from 'meteor/vulcan:core'
import { withStyles, createStyles } from '@material-ui/core/styles'
import Typography from '@material-ui/core/Typography';
import Button from '@material-ui/core/Button';
import { withSingle } from '../../lib/crud/withSingle';
import { withCookies } from 'react-cookie'
import { withMessages } from '../common/withMessages';
import classNames from 'classnames';
import Sequences from '../../lib/collections/sequences/collection';
import { SECTION_WIDTH } from '../common/SingleColumnSection';

const bannerHeight = 250 // TODO; 250

// TODO; fix mid-range widths
// TODO; still not handling the image window right

const styles = createStyles(theme => ({
  bannerContainer: {
    position: 'absolute',
    top: 120, // desktop header height + layout margin
    width: SECTION_WIDTH,
    [theme.breakpoints.down('sm')]: {
      top: 85
    },
    [theme.breakpoints.down('xs')]: {
      top: 77, // mobile header height
      right: 0,
      width: '100vw', // TODO; xs or sm?
    },
    height: bannerHeight,
    overflow: 'hidden',
    [theme.breakpoints.up('md')]: {
      boxShadow: '0 4px 8px 0 rgba(0, 0, 0, 0.2), 0 6px 20px 0 rgba(0, 0, 0, 0.19)',
    },
  },
  bannerImgWrapper: {
    position: 'absolute',
    transform: 'scale(1.1)',
    filter: 'blur(4px)',
    width: '100%',
  },
  bannerOverlay: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    background: theme.palette.primary.main,
    opacity: .5,
  },
  overImage: {
    position: 'relative',
    [theme.breakpoints.down('sm')]: {
      marginTop: -36, // Undo layout main (really?)
    },
    minHeight: bannerHeight, // TODO; can we remove repeated height?
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  overImageText: {
    margin: 0,
    textAlign: 'center',
    fontFamily: theme.typography.postStyle.fontFamily,
    color: '#FFFFFF',
  },
  title: {
    width: 300, // TODO;
    fontStyle: "italic",
  },
  divider: {
    width: 70,
    marginTop: 10,
    marginBottom: 10,
    borderBottom: "solid 1px #FFFFFF",
  },
  description: {
    width: 200, // TODO;
    fontSize: 17,
  },
  ctaButtonRoot: {
    marginTop: 26,
    ...theme.typography.display1,
    // margin: 0,
    fontFamily: theme.typography.postStyle.fontFamily,
    fontSize: 17,
    fontStyle: "italic",
    color: '#FFFFFF',
    textTransform: 'none',
  },
  ctaButtonLabel: {
  },
  dismiss: {
    // hack
    fontFamily: theme.typography.uiSecondary.fontFamily,
    fontSize: 14,
    marginTop: -20,
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
      messageString: "We won't show this again. If you want to read the Handbook, you can access it from the sidebar menu."
    })
  }
  
  console.log('document', document)

  return <React.Fragment>
    <SingleColumnSection>
      <div className={classes.bannerContainer}>
        <div className={classes.bannerImgWrapper}>
          <CloudinaryImage2
            publicId={document.bannerImageId}
            height={bannerHeight}
            width={true}
            objectFit='cover'
          />
        </div>
        <div className={classes.bannerOverlay} />
      </div>
      <div className={classes.overImage}>
        <Typography variant='display1' className={classNames(classes.overImageText, classes.title)}>
          {document.title}
        </Typography>
        <div className={classes.divider} />
        <Typography variant='display1' className={classNames(classes.overImageText, classes.description)}>
          Intro Sequence by {document.user.displayName}
        </Typography>
        <Button
          variant='contained'
          color='primary'
          classes={{root: classes.ctaButtonRoot, label: classes.ctaButtonLabel}}
        >
          Start Reading
        </Button>
      </div>
      <div className={classes.dismiss}>
        <a onClick={handleDismiss}>Don't show this</a>
      </div>
    </SingleColumnSection>
  </React.Fragment>
}

const options = {
  collection: Sequences,
  queryName: 'SequencesPageQuery',
  fragmentName: 'SequencesPageFragment',
  enableTotal: false,
  ssr: true,
};

registerComponent(
  'EAHomeHandbook', EAHomeHandbook,
  withStyles(styles, { name: 'EAHomeHandbook' }),
  withCookies, withMessages, [withSingle, options]
)
