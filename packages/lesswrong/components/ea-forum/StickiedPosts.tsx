import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import Button from '@material-ui/core/Button'
import LocationIcon from '@material-ui/icons/LocationOn'
import CloseIcon from '@material-ui/icons/Close'
import { Link } from '../../lib/reactRouterWrapper';
import { getBrowserLocalStorage } from '../editor/localStorageHandlers';
import { useTracking } from '../../lib/analyticsEvents';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    marginBottom: 24,
    [theme.breakpoints.down("md")]: {
      marginTop: 12,
      marginBottom: 8,
    }
  },
  jobAd: {
    display: 'flex',
    alignItems: 'center',
    columnGap: 15,
    background: theme.palette.panelBackground.default,
    fontFamily: theme.typography.fontFamily,
    padding: '10px 15px',
    marginTop: 3,
    [theme.breakpoints.down('xs')]: {
      columnGap: 12,
      padding: '6px 10px',
    }
  },
  jobAdLogo: {
    flex: 'none',
    width: 64,
    [theme.breakpoints.down('xs')]: {
      width: 40,
    }
  },
  jobAdBodyCol: {
    flexGrow: 1,
    marginBottom: 6,
    [theme.breakpoints.down('xs')]: {
      marginBottom: 4
    }
  },
  jobAdTopRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    columnGap: 10,
    marginBottom: 2
  },
  jobAdLabel: {
    flexGrow: 1,
    whiteSpace: 'pre',
    letterSpacing: 0.5,
    fontSize: 11,
    color: theme.palette.grey[500],
    fontStyle: 'italic'
  },
  jobAdFeedbackLink: {
    fontSize: 12,
    color: theme.palette.link.primaryDim,
    // fontStyle: 'italic',
    [theme.breakpoints.down('xs')]: {
      display: 'none'
    }
  },
  closeButton: {
    padding: '.25em',
    minHeight: '.75em',
    minWidth: '.75em',
  },
  closeIcon: {
    fontSize: 14,
    color: theme.palette.grey[400],
  },
  jobAdHeader: {
    fontFamily: theme.typography.postStyle.fontFamily,
    fontSize: 16,
    margin: '0 0 6px'
  },
  jobAdLink: {
    color: theme.palette.primary.main
  },
  jobAdOrgDescription: {
    fontFamily: theme.typography.postStyle.fontFamily,
    fontSize: 13,
    lineHeight: '20px',
    color: theme.palette.grey[700],
    marginBottom: 10
  },
  jobAdMetadataRow: {
    display: 'flex',
    flexWrap: 'wrap',
    columnGap: 30,
    rowGap: '3px'
  },
  jobAdMetadata: {
    display: 'flex',
    alignItems: 'center',
    columnGap: 4,
    fontSize: 13,
    color: theme.palette.grey[600],
  },
  jobAdMetadataIcon: {
    fontSize: 12,
  }
});

const StickiedPosts = ({
  classes,
}: {
  classes: ClassesType,
}) => {
  const { captureEvent } = useTracking()
  
  const dismissJobAd = () => {
    captureEvent('hideJobAd')
    const ls = getBrowserLocalStorage()
    if (ls) {
      ls.setItem('hideJobAd', true)
    }
  }
  
  const { SingleColumnSection, PostsList2 } = Components

  return <SingleColumnSection className={classes.root}>
    <PostsList2
      terms={{view:"stickied", limit:100, forum: true}}
      showNoResults={false}
      showLoadMore={false}
      hideLastUnread={false}
      boxShadow={false}
      curatedIconLeft={false}
    />
    <div className={classes.jobAd}>
      <img src="https://80000hours.org/wp-content/uploads/2019/07/Metaculus-160x160.jpeg" className={classes.jobAdLogo} />
      <div className={classes.jobAdBodyCol}>
        <div className={classes.jobAdTopRow}>
          <div className={classes.jobAdLabel}>Job  recommendation</div>
          <div className={classes.jobAdFeedbackLink}>
            <a href="https://docs.google.com/forms/d/e/1FAIpQLSdGyKmZRZHqdhEc70QNIzOTKy_j1aMEByGhE_HtciSNMUSJTA/viewform" target="_blank" rel="noopener noreferrer">Give us feedback</a>
          </div>
          <div className={classes.jobAdClose}>
            <Button className={classes.closeButton} onClick={dismissJobAd}>
              <CloseIcon className={classes.closeIcon} />
            </Button>
          </div>
        </div>
        <h2 className={classes.jobAdHeader}>
          Full-stack engineer at <Link to="/topics/metaculus" target="_blank" rel="noopener noreferrer" className={classes.jobAdLink}>
            Metaculus
          </Link>
        </h2>
        <div className={classes.jobAdOrgDescription}>
          Metaculus is an online forecasting platform and aggregation engine working to improve human reasoning and coordination on topics of global importance.
        </div>
        <div className={classes.jobAdMetadataRow}>
          <div className={classes.jobAdMetadata}>
            <LocationIcon className={classes.jobAdMetadataIcon} />
            Remote, USA
          </div>
          <div className={classes.jobAdMetadata}>
            $80k - $130k
          </div>
        </div>
      </div>
    </div>
  </SingleColumnSection>
}

const StickiedPostsComponent = registerComponent("StickiedPosts", StickiedPosts, {styles});

declare global {
  interface ComponentTypes {
    StickiedPosts: typeof StickiedPostsComponent
  }
}
