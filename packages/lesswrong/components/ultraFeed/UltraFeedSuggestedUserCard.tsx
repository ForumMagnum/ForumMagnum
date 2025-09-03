import React, { useCallback, useRef } from 'react';
import classNames from 'classnames';
import { defineStyles, useStyles } from '../hooks/useStyles';
import { useDialog } from '../common/withDialog';
import FollowUserButton from "../users/FollowUserButton";
import UserMetaInfo from "../users/UserMetaInfo";
import { Link } from '../../lib/reactRouterWrapper';
import { userGetProfileUrl } from '../../lib/collections/users/helpers';
import ContentStyles from "../common/ContentStyles";
import UltraFeedUserDialog from "./UltraFeedUserDialog";
import { commentBodyStyles } from '@/themes/stylePiping';
import { useQuery } from "@/lib/crud/useQuery";
import { gql } from "@/lib/generated/gql-codegen";
import Loading from "../vulcan-core/Loading";
import TagSmallPostLink from '../tagging/TagSmallPostLink';
import { AnalyticsContext } from '../../lib/analyticsEvents';

const UserRecentPostsQuery = gql(`
  query UserRecentPostsForCompactCard($selector: PostSelector, $limit: Int, $enableTotal: Boolean) {
    posts(selector: $selector, limit: $limit, enableTotal: $enableTotal) {
      results {
        ...PostsList
      }
    }
  }
`);

const styles = defineStyles("UltraFeedSuggestedUserCard", (theme: ThemeType) => ({
  root: {
    display: "flex",
    flexDirection: "column",
    width: "100%",
    boxSizing: 'border-box',
    height: 152,
    fontSize: 14,
    fontWeight: 450,
    lineHeight: "19.5px",
    color: theme.palette.text.primary,
    backgroundColor: theme.palette.panelBackground.default,
    border: `1px solid ${theme.palette.grey[300]}`,
    borderRadius: 8,
    padding: 16,
    minHeight: 140,
    overflow: 'hidden',
    transition: 'box-shadow 0.2s ease',
    cursor: 'pointer',
    ...theme.typography.postStyle,
    '&:hover': {
      boxShadow: theme.palette.boxShadow.default,
    },
  },
  nameRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
    gap: 8,
  },
  name: {
    fontSize: "1.8rem",
    fontWeight: 400,
    lineHeight: "1.2",
    color: theme.palette.grey["A400"],
    flex: "1 1 auto",
    minWidth: 0,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  nameLink: {
    color: 'inherit',
    textDecoration: 'none',
    cursor: 'pointer',
    '&:hover': {
      opacity: 0.7,
    },
  },
  followButtonWrapper: {
    flexShrink: 0,
  },
  metaRow: {
    fontSize: "0.9rem",
    marginBottom: 8,
    color: theme.palette.grey[600],
    '& .UserMetaInfo-info': {
      marginRight: 12,
    },
  },
  bio: {
    marginBottom: 8,
    lineHeight: "1.2rem",
    fontSize: "0.9rem",
  },
  bioText: {
    ...commentBodyStyles(theme),
    marginTop: 0,
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    '& p': {
      margin: 0,
    },
    '& p:first-child': {
      marginTop: 0,
    },
  },
  
  recentPosts: {
    borderTop: `1px solid ${theme.palette.grey[300]}`,
    paddingTop: 4,
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    minHeight: 0,
    overflow: 'hidden',
    width: '100%',
  },
  postWrapper: {
    position: 'relative',
    width: '100%',
    height: 'auto',
    overflow: 'hidden',
    display: 'table',
    tableLayout: 'fixed',
  },
  loadingContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
  }
}));

const UltraFeedSuggestedUserCard = ({ 
  user, 
  onFollowToggle
}: {
  user: UsersMinimumInfo;
  onFollowToggle?: (user: UsersMinimumInfo) => void;
}) => {
  const classes = useStyles(styles);
  const { openDialog } = useDialog();
  const followButtonRef = useRef<HTMLDivElement>(null);
  
  const hasBio = !!(user.htmlBio && user.htmlBio.trim().length > 0);
  
  const { data: postsData, loading: postsLoading } = useQuery(UserRecentPostsQuery, {
    variables: {
      selector: { userPosts: { userId: user._id, sortedBy: "new" } },
      limit: 2, // Fetch 2 posts for card
      enableTotal: false,
    },
    skip: hasBio,
    notifyOnNetworkStatusChange: true,
  });
  
  const handleOpenUserModal = useCallback(() => {
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

  const handleCardClick = useCallback((e: React.MouseEvent) => {
    // Don't open modal if clicking on follow button
    if (followButtonRef.current?.contains(e.target as Node)) {
      return;
    }
    const target = e.target as HTMLElement;
    // Check if we clicked on a link (like in posts)
    if (target.closest('a')) {
      return;
    }
    handleOpenUserModal();
  }, [handleOpenUserModal]);

  const handleFollowClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onFollowToggle?.(user);
  }, [user, onFollowToggle]);

  if (!user?._id) {
    return <div className={classes.root}>User not found</div>;
  }

  const { htmlBio, displayName } = user;
  const profileUrl = userGetProfileUrl(user);
  const posts = postsData?.posts?.results;

  
  return (
    <AnalyticsContext pageElementContext="suggestedUserCard" userIdDisplayed={user._id}>
      <div 
        className={classes.root}
        onClick={handleCardClick}
      >
        <div className={classes.nameRow}>
          <Link 
            to={profileUrl}
            className={classNames(classes.name, classes.nameLink)}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleOpenUserModal();
            }}
          >
            {displayName}
          </Link>
          <div 
            ref={followButtonRef}
            className={classes.followButtonWrapper}
            onClick={handleFollowClick}
          >
            <FollowUserButton 
              user={user} 
              styleVariant="ultraFeed"
            />
          </div>
        </div>
        
        <div className={classes.metaRow}>
          <UserMetaInfo 
            user={user} 
          />
        </div>
        
        {hasBio && (
          <ContentStyles className={classes.bio} contentType='postHighlight'>
            <div 
              className={classes.bioText} 
              dangerouslySetInnerHTML={{__html: htmlBio}}
            />
          </ContentStyles>
        )}
        
        {!hasBio && postsLoading && (
          <div className={classes.loadingContainer}>
            <Loading />
          </div>
        )}
        
        {!hasBio && posts && posts.length > 0 && (
          <div className={classes.recentPosts}>
            {posts.slice(0, 2).map((post) => post && (
              <div key={post._id} className={classes.postWrapper}>
                <TagSmallPostLink
                  post={post}
                  hideAuthor
                  disableHoverPreview
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </AnalyticsContext>
  );

};

export default UltraFeedSuggestedUserCard;


