import { Components, registerComponent } from '../../lib/vulcan-lib';
import { userGetProfileUrl } from '../../lib/collections/users/helpers';
import { Link } from '../../lib/reactRouterWrapper';
import React from 'react';
import type { Hit } from 'react-instantsearch-core';
import { Snippet } from 'react-instantsearch-dom';
import LocationIcon from '@material-ui/icons/LocationOn'

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    maxWidth: 600,
    paddingTop: 2,
    paddingBottom: 2,
    marginBottom: 18
  },
  link: {
    display: "flex",
    columnGap: 14,
  },
  profilePhotoCol: {
    flex: 'none'
  },
  displayNameRow: {
    display: "flex",
    flexWrap: 'wrap',
    alignItems: 'center',
    columnGap: 16,
    rowGap: '3px',
    color: theme.palette.grey[600],
    fontSize: 12,
    fontFamily: theme.typography.fontFamily,
  },
  metaInfo: {
    display: "flex",
    alignItems: 'center',
    columnGap: 3
  },
  metaInfoIcon: {
    fontSize: 12,
    color: theme.palette.grey[500],
  },
  displayName: {
    fontSize: 18,
    fontFamily: theme.typography.postStyle.fontFamily,
    color: theme.palette.grey[800],
    fontWeight: 600,
  },
  role: {
    fontFamily: theme.typography.fontFamily,
    fontSize: 12,
    color: theme.palette.grey[600],
    marginTop: 3
  },
  snippet: {
    overflowWrap: "break-word",
    fontFamily: theme.typography.fontFamily,
    wordBreak: "break-word",
    fontSize: 14,
    lineHeight: '21px',
    color: theme.palette.grey[700],
    marginTop: 5
  }
})

const ExpandedUsersSearchHit = ({hit, classes}: {
  hit: Hit<any>,
  classes: ClassesType,
}) => {
  const { FormatDate, ProfilePhoto, ForumIcon } = Components
  const user = hit as AlgoliaUser

  return <div className={classes.root}>
    <Link to={`${userGetProfileUrl(user)}?from=search_page`} className={classes.link}>
      <div className={classes.profilePhotoCol}>
        <ProfilePhoto user={user} noLink />
      </div>
      <div>
        <div className={classes.displayNameRow}>
          <span className={classes.displayName}>
            {user.displayName}
          </span>
          <FormatDate date={user.createdAt} />
          <span className={classes.metaInfo}>
            <ForumIcon icon="Star" className={classes.metaInfoIcon} /> {user.karma ?? 0}
          </span>
          {user.mapLocationAddress && <span className={classes.metaInfo}>
            <LocationIcon className={classes.metaInfoIcon} /> {user.mapLocationAddress}
          </span>}
        </div>
        {(user.jobTitle || user.organization) && <div className={classes.role}>
          {user.jobTitle} {user.organization ? `@ ${user.organization}` : ''}
        </div>}
        <div className={classes.snippet}>
          <Snippet className={classes.snippet} attribute="bio" hit={user} tagName="mark" />
        </div>
      </div>
    </Link>
  </div>
}

const ExpandedUsersSearchHitComponent = registerComponent("ExpandedUsersSearchHit", ExpandedUsersSearchHit, {styles});

declare global {
  interface ComponentTypes {
    ExpandedUsersSearchHit: typeof ExpandedUsersSearchHitComponent
  }
}

