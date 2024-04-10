import { Components, registerComponent } from '../../lib/vulcan-lib';
import React from 'react';
import type { Hit } from 'react-instantsearch-core';
import { Snippet } from 'react-instantsearch-dom';
import LocationIcon from '@material-ui/icons/LocationOn'
import classNames from 'classnames';
import {isFriendlyUI} from '../../themes/forumTheme.ts'

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
    cursor: "pointer",
    '&:hover': {
      opacity: 0.8
    }
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
})

const ExpandedUsersConversationSearchHit = ({
  hit,
  currentUser,
  onClose,
  onSelect,
  isModInbox = false,
  className,
  classes,
}: {
  hit: Hit<any>;
  currentUser: UsersCurrent;
  onClose: () => void;
  onSelect: (userId: Hit<any>) => void;
  isModInbox?: boolean;
  className?: string;
  classes: ClassesType;
}) => {
  const { FormatDate, UsersProfileImage, ForumIcon } = Components;
  const user = hit as SearchUser;

  return (
    <div className={classNames(className, classes.root)}>
      <div onClick={() => onSelect(user)} className={classes.link}>
        {isFriendlyUI && (
          <div className={classes.profilePhotoCol}>
            <UsersProfileImage user={user} size={36} />
          </div>
        )}
        <div>
          <div className={classes.displayNameRow}>
            <span className={classes.displayName}>{user.displayName}</span>
            <FormatDate date={user.createdAt} />
            <span className={classes.metaInfo}>
              <ForumIcon icon="Star" className={classes.metaInfoIcon} /> {user.karma}
            </span>
            {user.mapLocationAddress && (
              <span className={classes.metaInfo}>
                <LocationIcon className={classes.metaInfoIcon} /> {user.mapLocationAddress}
              </span>
            )}
          </div>
          {(user.jobTitle || user.organization) && (
            <div className={classes.role}>
              {user.jobTitle} {user.organization ? `@ ${user.organization}` : ""}
            </div>
          )}
          <div className={classes.snippet}>
            <Snippet className={classes.snippet} attribute="bio" hit={user} tagName="mark" />
          </div>
        </div>
      </div>
    </div>
  );
};

const ExpandedUsersConversationSearchHitComponent = registerComponent("ExpandedUsersConversationSearchHit", ExpandedUsersConversationSearchHit, {styles});

declare global {
  interface ComponentTypes {
    ExpandedUsersConversationSearchHit: typeof ExpandedUsersConversationSearchHitComponent
  }
}

