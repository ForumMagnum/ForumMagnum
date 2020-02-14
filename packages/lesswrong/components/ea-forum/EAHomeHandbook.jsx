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
import { Link } from '../../lib/reactRouterWrapper';
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
    '@media (max-width: 959.95px) and (min-width: 600px)': {
      top: 86, // tablet header height
    },
    [`@media (max-width: ${SECTION_WIDTH-1}px)`]: {
      right: 0,
      width: '100vw',
    },
    [theme.breakpoints.down('xs')]: {
      top: 77, // mobile header height
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
    '& img': {
      marginLeft: '50%',
      transform: 'translateX(-50%)',
    },
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
      marginTop: -36, // mobile/tablet header height
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
    '& a:hover': {
      // Don't change opacity on hover
      opacity: 1,
    },
  },
  title: {
    width: 300,
    fontStyle: "italic",
  },
  divider: {
    width: 70,
    marginTop: 10,
    marginBottom: 10,
    borderBottom: "solid 1px #FFFFFF",
  },
  description: {
    width: 200,
    fontSize: 17,
  },
  ctaButton: {
    marginTop: 26,
    ...theme.typography.display1,
    // margin: 0,
    fontFamily: theme.typography.postStyle.fontFamily,
    fontSize: 17,
    fontStyle: "italic",
    color: '#FFFFFF',
    textTransform: 'none',
  },
  dismiss: {
    // hack
    position: 'relative',
    marginTop: -20,
    [`@media (min-width: ${SECTION_WIDTH-1}px)`]: {
      marginRight: 4,
    },
    fontFamily: theme.typography.uiSecondary.fontFamily,
    fontSize: 14,
    textAlign: 'right',
    color: '#BBB',
    zIndex: 1,
  },
}))

const COOKIE_NAME = 'hide_home_handbook'
const END_OF_TIME = new Date('2038-01-18')
const FIRST_POST_ID = 'vwgZZq3asJk5f7PRX' // TODO; getSetting('')

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
            width={SECTION_WIDTH}
            objectFit='cover'
          />
        </div>
        <div className={classes.bannerOverlay} />
      </div>
      <div className={classes.overImage}>
        <Typography variant='display1' className={classNames(classes.overImageText, classes.title)}>
          <Link to={`/s/${document._id}`}>{document.title}</Link>
        </Typography>
        <div className={classes.divider} />
        <Typography variant='display1' className={classNames(classes.overImageText, classes.description)}>
          Intro Sequence by{' '}
          <Link to={`/users/${document.user.slug}`}>{document.user.displayName}</Link>
        </Typography>
        <Button
          variant='contained'
          color='primary'
          className={classes.ctaButton}
          href={`/posts/${FIRST_POST_ID}/TODOSLUG`} // TODO; slug
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
