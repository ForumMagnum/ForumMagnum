import { Components, registerComponent, } from '../../../lib/vulcan-lib';
import React, { MouseEventHandler } from 'react';
import { createStyles } from '@material-ui/core/styles';
import { useMulti } from '../../../lib/crud/withMulti';
import { Link } from '../../../lib/reactRouterWrapper';
import { cloudinaryCloudNameSetting } from '../../../lib/publicSettings';
import Button from '@material-ui/core/Button';
import { requireCssVar } from '../../../themes/cssVars';

import { isFriendlyUI, preferredHeadingCase } from '../../../themes/forumTheme';

const styles = createStyles((theme: ThemeType): JssStyles => ({
  noResults: {
    ...theme.typography.commentStyle,
    textAlign: 'center',
    fontSize: 18,
  },
  noResultsText: {
    marginTop: 30
  },
  noResultsCTA: {
    fontSize: 14,
    marginTop: 20
  },
  eventsLink: {
    color: theme.palette.primary.main,
  },
  includeInactiveBtn: {
    textTransform: 'none',
    fontSize: 14,
  },
  onlineGroups: {
    marginTop: 20,
    [theme.breakpoints.down('sm')]: {
      marginLeft: -8,
      marginRight: -8,
    }
  },
  onlineGroup: {
    height: 116,
    borderBottomWidth: 1,
    borderBottomStyle: 'solid',
    borderColor: theme.palette.greyAlpha(.1),
    '&:last-of-type': {
      borderBottom: 'none'
    },
    [theme.breakpoints.down('xs')]: {
      height: 'auto'
    },
  },
  mobileImg: {
    display: 'none',
    height: 160,
    backgroundColor: theme.palette.background.primaryDim,
    justifyContent: 'center',
    alignItems: 'center',
    [theme.breakpoints.down('xs')]: {
      display: 'flex'
    },
  },
  onlineGroupContent: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 115,
    background: theme.palette.panelBackground.default,
    backgroundRepeat: 'no-repeat',
    backgroundPositionY: 'center',
    padding: '15px 20px 15px 204px',
    '@media (max-width: 730px)': {
      paddingLeft: 94
    },
    [theme.breakpoints.down('xs')]: {
      display: 'block',
      height: 'auto',
      backgroundImage: 'none !important',
      paddingLeft: 4,
      paddingBottom: 30
    },
  },
  onlineGroupText: {
    backgroundColor: theme.palette.panelBackground.default,
    minWidth: 0,
    padding: '6px 15px',
  },
  onlineGroupNameRow: {
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis',
    overflow: 'hidden',
    [theme.breakpoints.down('xs')]: {
      whiteSpace: 'normal'
    }
  },
  onlineGroupName: isFriendlyUI ? {
      ...theme.typography.headerStyle,
      fontWeight: 700,
      fontSize: 18,
    }
    : {
      ...theme.typography.headline,
      fontSize: 20,
    },
  inactiveGroupTag: {
    color: theme.palette.grey[500],
    marginRight: 10
  },
  onlineGroupDescription: {
    ...theme.typography.commentStyle,
    color: theme.palette.text.dim60,
    fontSize: 14,
    lineHeight: '1.6em',
    display: '-webkit-box',
    "-webkit-line-clamp": 2,
    "-webkit-box-orient": 'vertical',
    overflow: 'hidden',
    marginTop: 8,
    [theme.breakpoints.down('xs')]: {
      "-webkit-line-clamp": 4,
    },
  },
  onlineGroupJoin: {
    alignSelf: 'center',
    flex: 'none',
    marginLeft: 14,
    [theme.breakpoints.down('xs')]: {
      textAlign: 'right',
      marginTop: 16,
      marginLeft: 0
    }
  },
  onlineGroupBtn: {
    ...theme.typography.commentStyle,
    color: theme.palette.primary.main,
    padding: '10px 14px',
    borderRadius: 4,
    fontSize: isFriendlyUI ? 14 : theme.typography.commentStyle.fontSize,
  },
  postGroupsCTA: {
    textAlign: 'center',
    padding: 20
  },
}))

const defaultBackground = requireCssVar("palette", "panelBackground", "default");
const dimBackground = requireCssVar("palette", "background", "primaryDim");

const OnlineGroups = ({keywordSearch, includeInactive, toggleIncludeInactive, classes}: {
  keywordSearch: string,
  includeInactive: boolean,
  toggleIncludeInactive: MouseEventHandler,
  classes: ClassesType,
}) => {
  const { CloudinaryImage2 } = Components
  
  const { results, loading } = useMulti({
    terms: {view: 'online', includeInactive},
    collectionName: "Localgroups",
    fragmentName: 'localGroupsHomeFragment',
    fetchPolicy: 'cache-and-network',
    nextFetchPolicy: "cache-first",
    limit: 200,
  });
  
  const cloudinaryCloudName = cloudinaryCloudNameSetting.get()
  
  // filter the list of groups if the user has typed in a keyword
  let onlineGroups = results
  if (results && keywordSearch) {
    onlineGroups = results.filter(group => group.name.toLowerCase().includes(keywordSearch.toLowerCase()))
  }
  
  if (!loading && !onlineGroups?.length) {
    // link to the Events page when there are no groups to show
    return <div className={classes.noResults}>
      <div className={classes.noResultsText}>No online groups matching your search</div>
      <div className={classes.noResultsCTA}>
        {includeInactive ? <Link to={'/events'} className={classes.eventsLink}>
            Find an online event
          </Link> : <Button color="primary" onClick={toggleIncludeInactive} className={classes.includeInactiveBtn}>
            Search inactive groups
          </Button>}
      </div>
    </div>
  }

  return (
    <div className={classes.onlineGroups}>
      <div className={classes.onlineGroupsList}>
        {onlineGroups?.map(group => {
          const rowStyle = group.bannerImageId ? {
            backgroundImage: `linear-gradient(to right, transparent, ${defaultBackground} 200px), url(https://res.cloudinary.com/${cloudinaryCloudName}/image/upload/c_crop,g_custom/c_fill,h_115,w_200,q_auto,f_auto/${group.bannerImageId})`
          } : {
            backgroundImage: `url(https://res.cloudinary.com/cea/image/upload/c_pad,h_80,w_200,q_auto,f_auto/ea-logo-square-1200x1200__1_.png), linear-gradient(to right, ${dimBackground}, ${defaultBackground} 200px)`
          }
          
          return <div key={group._id} className={classes.onlineGroup}>
            <Link to={`/groups/${group._id}`} className={classes.mobileImg}>
              {group.bannerImageId ?
                <CloudinaryImage2 height={160} width="100vw" objectFit="cover" publicId={group.bannerImageId} imgProps={{w:'600'}} /> :
                <img src="https://res.cloudinary.com/cea/image/upload/h_120,q_auto,f_auto/ea-logo-square-1200x1200__1_.png" />}
            </Link>
            <div className={classes.onlineGroupContent} style={rowStyle}>
              <div className={classes.onlineGroupText}>
                <div className={classes.onlineGroupNameRow}>
                  <Link to={`/groups/${group._id}`} className={classes.onlineGroupName}>
                    {group.inactive ? <span className={classes.inactiveGroupTag}>[Inactive]</span> : null}
                    {group.name}
                  </Link>
                </div>
                <div className={classes.onlineGroupDescription}>{group.contents?.plaintextDescription}</div>
              </div>
              <div className={classes.onlineGroupJoin}>
                <Link to={`/groups/${group._id}`} className={classes.onlineGroupBtn}>
                  {preferredHeadingCase("Learn More")}
                </Link>
              </div>
            </div>
          </div>
        })}
        {!includeInactive && <div className={classes.postGroupsCTA}>
          <Button color="primary" onClick={toggleIncludeInactive} className={classes.includeInactiveBtn}>
            Search inactive groups
          </Button>
        </div>}
      </div>
    </div>
  )
}

const OnlineGroupsComponent = registerComponent('OnlineGroups', OnlineGroups, {styles});

declare global {
  interface ComponentTypes {
    OnlineGroups: typeof OnlineGroupsComponent
  }
}
