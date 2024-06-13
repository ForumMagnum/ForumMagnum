import React from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import { truncate } from '../../lib/editor/ellipsize';
import { useMulti } from '@/lib/crud/withMulti';
import { userHasSubscribeTabFeed } from '@/lib/betas';
import { useCurrentUser } from '../common/withUser';
import { commentBodyStyles } from '@/themes/stylePiping';

const styles = (theme: ThemeType) => ({
  root: {
    display: "flex",
    flexDirection: "column",
    width: 350,
    maxWidth: "unset",
    fontSize: 14,
    fontWeight: 450,
    lineHeight: "19.5px",
    padding: 16,
    color: theme.palette.text.primary,
    background: theme.palette.panelBackground.default,
    boxShadow: theme.palette.boxShadow.lwTagHoverOver,
    ...theme.typography.postStyle
  },
  header: {
    display: "flex",
    flexDirection: "column",
    maxWidth: 400,
  },
  name: {
    marginTop: 4,
    fontSize: "1.7rem",
    fontWeight: 400,
    color: theme.palette.grey["A400"],
  },
  metaRow: {
    marginTop: 8,
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    color: theme.palette.grey["600"],
    fontSize: "1.1rem",
  },
  bio: {
    marginTop: 8,
    lineHeight: "1.3rem",
  },
  bioText: {
    ...commentBodyStyles(theme),
    marginTop: 0
  },
  posts: {
    marginTop: 8,
    paddingTop: 8,
    borderTop: theme.palette.border.extraFaint,
    overflow: "hidden",
  },
});

export const LWUserTooltipContent = ({hideFollowButton=false, classes, user}: {
  hideFollowButton?: boolean,
  classes: ClassesType<typeof styles>,
  user: UsersMinimumInfo,
}) => {

  const { ContentStyles, TagSmallPostLink, FollowUserButton, UserMetaInfo, Loading } = Components

  const currentUser = useCurrentUser();

  const { htmlBio, displayName } = user;
  const truncatedBio = truncate(htmlBio, 500)

  const { loading, results } = useMulti({
    terms: {
      userId: user._id,
      view: "userPosts",
      sortedBy: "new"
    },
    collectionName: "Posts",
    fragmentName: 'PostsList',
    enableTotal: false,
    limit: 3,
  });


  return (
    <div className={classes.root}>
      <div className={classes.header}>
        <div className={classes.name}>{displayName}</div>
        <div className={classes.metaRow}>
          <UserMetaInfo user={user} />
          {!hideFollowButton && userHasSubscribeTabFeed(currentUser) && <FollowUserButton user={user} />}
        </div>
      </div>

      {truncatedBio && <ContentStyles className={classes.bio} contentType='postHighlight'>
        <div className={classes.bioText } dangerouslySetInnerHTML={{__html: truncatedBio}}/>
      </ContentStyles>}
      {results && <div className={classes.posts}>
        {results.map((post) => post &&
          <TagSmallPostLink
            key={post._id}
            post={post}
            hideAuthor
            disableHoverPreview
          />
        )}
      </div>}
      {loading && <Loading />}
    </div>
);
}

const LWUserTooltipContentComponent = registerComponent(
  'LWUserTooltipContent',
  LWUserTooltipContent,
  {styles},
);

declare global {
  interface ComponentTypes {
    LWUserTooltipContent: typeof LWUserTooltipContentComponent
  }
}
