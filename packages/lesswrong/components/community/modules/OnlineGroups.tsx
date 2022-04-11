import { Components, registerComponent, } from '../../../lib/vulcan-lib';
import React from 'react';
import { createStyles } from '@material-ui/core/styles';
import * as _ from 'underscore';
import LinkIcon from '@material-ui/icons/Link';
import { useMulti } from '../../../lib/crud/withMulti';
import { Link } from '../../../lib/reactRouterWrapper';
import { cloudinaryCloudNameSetting } from '../../../lib/publicSettings';
import { FacebookIcon, SlackIcon } from '../../localGroups/GroupLinks';

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
  onlineGroups: {
    marginTop: 20,
    [theme.breakpoints.down('sm')]: {
      marginLeft: -4,
      marginRight: -4,
    }
  },
  onlineGroup: {
    height: 116,
    borderBottomWidth: 1,
    borderBottomStyle: 'solid',
    borderColor: "rgba(0, 0, 0, 0.1)",
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
    backgroundColor: '#e2f1f4',
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
    background: 'white',
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
    backgroundColor: 'white',
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
  onlineGroupName: {
    ...theme.typography.headline,
    fontSize: 20,
  },
  onlineGroupDescription: {
    ...theme.typography.commentStyle,
    color: "rgba(0, 0, 0, 0.6)",
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
    display: 'inline-flex',
    alignItems: 'center',
    width: 80,
    ...theme.typography.commentStyle,
    backgroundColor: theme.palette.primary.main,
    color: 'white',
    padding: '10px 16px',
    borderRadius: 4,
  },
  onlineGroupBtnIcon: {
    fontSize: 13,
    marginRight: 8
  },
  onlineGroupBtnIconWebsite: {
    transform: "translateY(3px) rotate(-45deg)",
    fontSize: 15,
    marginTop: -7,
    marginRight: 8
  }
}))


const OnlineGroups = ({keywordSearch, classes}: {
  keywordSearch: string,
  classes: ClassesType,
}) => {
  const { CloudinaryImage2 } = Components
  
  const { results, loading } = useMulti({
    terms: {view: 'online'},
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
        <Link to={'/events'} className={classes.eventsLink}>
          Find an online event
        </Link>
      </div>
    </div>
  }

  return (
    <div className={classes.onlineGroups}>
      <div className={classes.onlineGroupsList}>
        {onlineGroups?.map(group => {
          const rowStyle = group.bannerImageId ? {
            backgroundImage: `linear-gradient(to right, transparent, white 200px), url(https://res.cloudinary.com/${cloudinaryCloudName}/image/upload/c_fill,g_custom,h_115,w_200,q_auto,f_auto/${group.bannerImageId})`
          } : {
            backgroundImage: 'url(https://res.cloudinary.com/cea/image/upload/c_pad,h_80,w_200,q_auto,f_auto/ea-logo-square-1200x1200__1_.png), linear-gradient(to right, #e2f1f4, white 200px)'
          }
          // try to highlight to the most relevant link for the group
          // (eventually we should let the group pick a link)
          let cta;
          if (group.facebookLink) {
            cta = <a href={group.facebookLink} className={classes.onlineGroupBtn}>
              <FacebookIcon className={classes.onlineGroupBtnIcon} />
              <div>Join</div>
            </a>
          } else if (group.slackLink) {
            cta = <a href={group.slackLink} className={classes.onlineGroupBtn}>
              <SlackIcon className={classes.onlineGroupBtnIcon} />
              <div>Join</div>
            </a>
          } else if (group.website) {
            cta = <a href={group.website} className={classes.onlineGroupBtn}>
              <LinkIcon className={classes.onlineGroupBtnIconWebsite} />
              <div>Join</div>
            </a>
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
                  <Link to={`/groups/${group._id}`} className={classes.onlineGroupName}>{group.name}</Link>
                </div>
                <div className={classes.onlineGroupDescription}>{group.contents?.plaintextDescription}</div>
              </div>
              <div className={classes.onlineGroupJoin}>
                {cta}
              </div>
            </div>
          </div>
        })}
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
