import { userGetProfileUrl } from '../../lib/collections/users/helpers';
import { Link } from '../../lib/reactRouterWrapper';
import React from 'react';
import type { Hit } from 'react-instantsearch-core';
import { Snippet } from 'react-instantsearch-dom';
import LocationIcon from '@/lib/vendor/@material-ui/icons/src/LocationOn'
import FormatDate from "../common/FormatDate";
import ForumIcon from "../common/ForumIcon";
import { defineStyles } from '@/components/hooks/defineStyles';
import { useStyles } from '@/components/hooks/useStyles';

const styles = defineStyles("ExpandedUsersSearchHit", (theme: ThemeType) => ({
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
    fontFamily: theme.typography.fontFamily,
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
}))

const ExpandedUsersSearchHit = ({hit}: {
  hit: Hit<any>,
}) => {
  const classes = useStyles(styles);
  const user = hit as SearchUser;

  return <div className={classes.root}>
    <Link to={`${userGetProfileUrl(user)}?from=search_page`} className={classes.link}>
      <div>
        <div className={classes.displayNameRow}>
          <span className={classes.displayName}>
            {user.displayName}
          </span>
          <FormatDate date={user.createdAt} />
          <span className={classes.metaInfo}>
            <ForumIcon icon="Star" className={classes.metaInfoIcon} /> {user.karma}
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

export default ExpandedUsersSearchHit



