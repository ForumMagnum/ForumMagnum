import React, { useEffect, useRef, useCallback } from 'react';
import classNames from 'classnames';
import { defineStyles, useStyles } from '../hooks/useStyles';
import { useCurrentUserId } from '../common/withUser';
import { useDialog } from '../common/withDialog';
import FollowUserButton from "../users/FollowUserButton";
import UserMetaInfo from "../users/UserMetaInfo";
import UserContentFeed from "../users/UserContentFeed";
import { Link } from '../../lib/reactRouterWrapper';
import { userGetProfileUrl } from '../../lib/collections/users/helpers';
import UserActionsButton from "../dropdowns/users/UserActionsButton";
import FeedContentBody from "./FeedContentBody";
import UltraFeedUserDialog from "./UltraFeedUserDialog";
import { SHOW_ALL_BREAKPOINT_VALUE } from './ultraFeedSettingsTypes';

const styles = defineStyles("UltraFeedUserCard", (theme: ThemeType) => ({
  root: {
    display: "flex",
    flexDirection: "column",
    width: "100%",
    fontSize: 14,
    fontWeight: 450,
    lineHeight: "19.5px",
    color: theme.palette.text.primary,
    backgroundColor: theme.palette.panelBackground.bannerAdTranslucentHeavy,
    borderRadius: 8,
    ...theme.typography.postStyle,
  },
  rootInModal: {
    height: '100%',
    borderRadius: 0,
    overflow: 'hidden',
  },
  rootInHover: {
    width: 400,
    maxHeight: 600,
    overflow: 'hidden',
    boxShadow: theme.palette.boxShadow.lwTagHoverOver,
  },
  topSection: {
    paddingLeft: 20,
    paddingRight: 20,
    paddingTop: 16,
  },
  scrollableContent: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'auto',
    scrollbarWidth: 'none', // Firefox
    '&::-webkit-scrollbar': {
      display: 'none', // Chrome, Safari, Edge
    },
  },
  nameRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
    flexWrap: "wrap-reverse",
    minHeight: 45,
    marginBottom: 12,
    width: "100%",
  },
  nameRowHover: {
    marginBottom: 4,
    flexWrap: "wrap",  // Normal wrap order for hover card
  },
  name: {
    fontSize: "2.5em",
    lineHeight: "1.2",
    fontWeight: 400,
    color: theme.palette.grey["A400"],
    wordBreak: "break-word",
    minWidth: 0,
    flex: "1 0 auto",
    position: "relative",
    top: "0.08em",  // Compensate for descender space (adjust as needed)
  },
  nameInHover: {
    fontSize: "2.2rem",
    position: "relative",
    top: "0.08em",
    overflowWrap: "break-word",
    wordBreak: "break-word",
    lineHeight: "1.2",
    flex: "1 0 200px",
    minWidth: 0,
  },
  nameLink: {
    color: 'inherit',
    textDecoration: 'none',
    cursor: 'pointer',
    '&:hover': {
      opacity: 0.8,
    },
  },
  followButton: {
    flexShrink: 0,
  },
  buttonsContainer: {
    display: 'flex',
    gap: 8,
    alignItems: 'center',
    flexShrink: 0,
    marginLeft: 'auto',
  },
  metaRow: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    color: theme.palette.grey[600],
    fontSize: "1.1rem",
    '& .UserMetaInfo-info': {
      marginRight: 16,
    },
  },
  bio: {
    marginTop: 12,
    lineHeight: "1.3rem",
  },
  contentSection: {
    marginTop: 12,
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: theme.palette.grey[200],
  },
  hoverCardContent: {
    paddingTop: 16,
    paddingLeft: 20,
    paddingRight: 20,
    paddingBottom: 20,
  },
}));

const UltraFeedUserCard = ({ user, inModal = false, onNameVisibilityChange }: {
  user: UsersMinimumInfo;
  inModal?: boolean;
  onNameVisibilityChange?: (isHidden: boolean) => void;
}) => {
  const classes = useStyles(styles);
  const currentUserId = useCurrentUserId();
  const { openDialog } = useDialog();
  const nameRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  const handleOpenUserModal = useCallback(() => {
    if (!user) return;
    openDialog({
      name: "UltraFeedUserDialog",
      closeOnNavigate: true,
      contents: ({ onClose }) => (
        <UltraFeedUserDialog
          user={user}
          onClose={onClose}
        />
      )
    });
  }, [openDialog, user]);

  // Track visibility of the name row when in modal
  useEffect(() => {
    if (!inModal || !onNameVisibilityChange || !nameRef.current || !scrollContainerRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        onNameVisibilityChange(!entry.isIntersecting);
      },
      {
        root: scrollContainerRef.current,
        threshold: 1.0,
        rootMargin: '150px 0px 0px 0px' // Delay showing header items until scrolled 150px
      }
    );

    observer.observe(nameRef.current);

    return () => observer.disconnect();
  }, [inModal, onNameVisibilityChange]);

  if (!user?._id) {
    return <div className={classes.root}>User not found</div>;
  }

  const { htmlBio, displayName } = user;
  const profileUrl = userGetProfileUrl(user);

  if (inModal) {
    return (
      <div className={classNames(classes.root, classes.rootInModal)}>
        <div className={classes.scrollableContent} ref={scrollContainerRef}>
          <div className={classes.topSection}>
            <div className={classes.nameRow} ref={nameRef}>
              <div className={classes.name}>
                <Link to={profileUrl} className={classes.nameLink}>
                  {displayName}
                </Link>
              </div>
              <div className={classes.buttonsContainer}>
                {currentUserId !== user._id && (
                  <UserActionsButton 
                    user={user} 
                    from="ultraFeedModal"
                    placement="bottom-end"
                  />
                )}
                <div className={classes.followButton}>
                  <FollowUserButton user={user} styleVariant="ultraFeed" />
                </div>
              </div>
            </div>
            <div className={classes.metaRow}>
              <UserMetaInfo user={user} />
            </div>
            {htmlBio && (
              <FeedContentBody
                html={htmlBio}
                initialWordCount={SHOW_ALL_BREAKPOINT_VALUE}
                maxWordCount={SHOW_ALL_BREAKPOINT_VALUE}
                className={classes.bio}
              />
            )}
          </div>
          <div className={classes.contentSection}>
            <UserContentFeed 
              userId={user._id} 
              initialLimit={5}
              scrollContainerRef={scrollContainerRef}
            />
          </div>
        </div>
      </div>
    );
  }

  // Non-modal layout (for hover card)
  return (
    <div className={classNames(classes.root, classes.rootInHover)}>
      <div className={classes.hoverCardContent}>
        <div className={classNames(classes.nameRow, classes.nameRowHover)}>
          <div 
            className={classNames(classes.name, classes.nameInHover, classes.nameLink)}
            onClick={handleOpenUserModal}
          >
            {displayName}
          </div>
          <div className={classes.followButton}>
            <FollowUserButton user={user} styleVariant="ultraFeed" />
          </div>
        </div>
        <div className={classes.metaRow}>
          <UserMetaInfo user={user} />
        </div>
        {htmlBio && (
          <FeedContentBody
            html={htmlBio}
            initialWordCount={250}
            maxWordCount={1000}
            onContinueReadingClick={handleOpenUserModal}
            className={classes.bio}
          />
        )}
      </div>
    </div>
  );
};

export default UltraFeedUserCard;
