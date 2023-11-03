import { Components, registerComponent } from '../../lib/vulcan-lib';
import { userGetProfileUrl } from '../../lib/collections/users/helpers';
import { Link } from '../../lib/reactRouterWrapper';
import React from 'react';
import type { Hit } from 'react-instantsearch-core';
import { Snippet } from 'react-instantsearch-dom';
import LocationIcon from '@material-ui/icons/LocationOn'
import { isFriendlyUI } from '../../themes/forumTheme';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    maxWidth: 600,
    paddingTop: 2,
    paddingBottom: 2,
    marginBottom: 18,
  },
  link: {
    display: "flex",
    flexDirection: 'column',
    backgroundColor: theme.palette.text.alwaysWhite,
    padding: "2em",
    borderRadius: 6,
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
    columnGap: 3,
    color: theme.palette.text.normal,
  },
  metaInfoIcon: {
    fontSize: 12,
    color: theme.palette.text.normal,
  },
  displayName: {
    fontSize: 18,
    color: theme.palette.text.normal,
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
    color: theme.palette.text.normal,
    marginTop: "1.5em",
  },
})

const ExpandedUsersSearchHit = ({hit, showKarma = false, classes}: {
  hit: Hit<any>,
  showKarma?: boolean,
  classes: ClassesType,
}) => {
  const {UsersProfileImage, ForumIcon} = Components;
  const user = hit as AlgoliaUser;

  return <div className={classes.root}>
    <Link to={`${userGetProfileUrl(user)}?from=search_page`} className={classes.link}>
      <div>
        <div className={classes.displayNameRow}>
          {isFriendlyUI && <div className={classes.profilePhotoCol}>
            <UsersProfileImage user={user} size={36}/>
          </div>}

          <span className={classes.displayName}>
            {user.username}
          </span>
          {showKarma && <span className={classes.metaInfo}>
            <ForumIcon icon="Star" className={classes.metaInfoIcon}/> {user.karma ?? 0}
          </span>}
          {(user.firstName || user.lastName) &&
            <span className={classes.metaInfo}> {user.firstName} {user.lastName}</span>
          }
          {user.mapLocationAddress && <span className={classes.metaInfo}>
            <LocationIcon className={classes.metaInfoIcon}/> {user.mapLocationAddress}
          </span>}
        </div>
        {(user.jobTitle || user.organization) && <div className={classes.role}>
          {user.jobTitle} {user.organization ? `@ ${user.organization}` : ''}
        </div>}
      </div>
      {/*Going a bit into weeds of how the hits are rendered to prevent snippet component rendering if it's empty*/}
      {hit?._snippetResult?.bio?.value && <div className={classes.snippet}>
        <Snippet className={classes.snippet} attribute="bio" hit={user} tagName="mark"/>
      </div>}
    </Link>
  </div>
}

const ExpandedUsersSearchHitComponent = registerComponent("ExpandedUsersSearchHit", ExpandedUsersSearchHit, {styles});

declare global {
  interface ComponentTypes {
    ExpandedUsersSearchHit: typeof ExpandedUsersSearchHitComponent
  }
}

