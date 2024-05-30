import React from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import { truncate } from '../../lib/editor/ellipsize';
import DescriptionIcon from '@material-ui/icons/Description';
import MessageIcon from '@material-ui/icons/Message';
import TagIcon from '@material-ui/icons/LocalOffer';
import classNames from 'classnames';
import { useMulti } from '@/lib/crud/withMulti';

const styles = (theme: ThemeType) => ({
  root: {
    display: "flex",
    flexDirection: "column",
    width: 350,
    maxWidth: "unset",
    fontSize: 14,
    fontWeight: 450,
    lineHeight: "19.5px",
    // fontFamily: theme.palette.fonts.sansSerifStack,
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
  },
  stats: {
    display: "flex",
    alignItems: "center",
  },
  bio: {
    // borderTop: theme.palette.border.extraFaint,
    marginTop: 8,
    lineHeight: "1.3rem",
  },
  bioText: {
    fontSize: "1.1rem",
  },
  icon: {
    height: "1rem",
    width: "1rem",
    position: "relative",
  },
  omegaIcon: {
    fontWeight: 600,
    marginTop: -4,
    height: "1rem",
    width: "1rem",
    position: "relative",
    fontFamily: ['Palatino',
      '"Palatino Linotype"',
      '"Palatino LT STD"',
      '"Book Antiqua"',
      'Georgia',
      'serif'].join(','),
  },
  info: {
    display: "flex",
    alignItems: "center",
    marginRight: 8,
    fontSize: "1.1rem",
    textWrap: "nowrap",
    ...theme.typography.commentStyle,
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

  const { FormatDate, ForumIcon, ContentStyles, TagSmallPostLink, FollowUserButton, Loading } = Components

  const {
    htmlBio,
    displayName,
    createdAt,
    karma,
    afKarma,
    postCount,
    commentCount,
  } = user;

  const {loading, results} = useMulti({
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

  const truncatedBio = truncate(htmlBio, 500)
  const wikiContributionCount = user.tagRevisionCount

  return (
    <div className={classes.root}>
      <div className={classes.header}>
        <div className={classes.name}>{displayName}</div>
        <div className={classes.metaRow}>
          <div className={classes.stats}>
            {karma && <div className={classes.info}>
              <ForumIcon icon="Star" className={classes.icon} />
              <div>{karma}</div>
            </div>}
            {afKarma > 0 && <div className={classes.info}>
              <div className={classes.omegaIcon}>Ω</div>
              <div>{afKarma}</div>
            </div>}
            {!!postCount && <div className={classes.info}>
              <DescriptionIcon className={classes.icon} /> 
              {postCount}
            </div>}
            { !!commentCount && <div className={classes.info}>
              <MessageIcon className={classes.icon} />
              {commentCount}
            </div>}
            { !!wikiContributionCount && <div className={classes.info}>
              <TagIcon className={classes.icon}  /> 
              {wikiContributionCount}
            </div>}
            <div className={classes.info}>
              <FormatDate date={createdAt}/>
            </div>
          </div>
          {!hideFollowButton && <FollowUserButton user={user} />}
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
            // widerSpacing={postCount > 3}
            hideAuthor
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
