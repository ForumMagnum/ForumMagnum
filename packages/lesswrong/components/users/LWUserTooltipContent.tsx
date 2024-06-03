import React from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import { truncate } from '../../lib/editor/ellipsize';
import { useMulti } from '@/lib/crud/withMulti';
import { userHasSubscribeTabFeed } from '@/lib/betas';
import { useCurrentUser } from '../common/withUser';

const styles = (theme: ThemeType) => ({
  root: {
    display: "flex",
    flexDirection: "column",
    width: 350,
    // maxWidth: "unset",
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
    fontSize: "1.1rem",
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
  const { ContentStyles, TagSmallPostLink, FollowUserButton, UserMetaInfo, Loading } = Components;
  
  const { htmlBio, displayName } = user;
  const truncatedBio = truncate(htmlBio, 500);

  const currentUser = useCurrentUser();

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

// import React from 'react';
// import { userGetCommentCount, userGetPostCount } from '../../lib/collections/users/helpers';
// import { registerComponent, Components } from '../../lib/vulcan-lib';
// import { truncate } from '../../lib/editor/ellipsize';
// import DescriptionIcon from '@material-ui/icons/Description';
// import MessageIcon from '@material-ui/icons/Message';
// import TagIcon from '@material-ui/icons/LocalOffer';
// import { BookIcon } from '../icons/bookIcon'
// import classNames from 'classnames';
// import { taggingNameIsSet, taggingNameSetting } from '../../lib/instanceSettings';

// const styles = (theme: ThemeType): JssStyles => ({
//   tooltip: {
//     maxWidth: 250,
//   },
//   joined: {
//     ...theme.typography.italic,
//     marginBottom: theme.spacing.unit,
//   },
//   bookIcon: {
//     filter: "invert(100%)",
//   },
//   bio: {
//     marginTop: theme.spacing.unit,
//     lineHeight: "1.3rem",
//   },
//   icon: {
//     height: "1rem",
//     width: "1rem",
//     position: "relative",
//     top: 2,
//     color: theme.palette.icon.tooltipUserMetric,
//   },
// });

// export const LWUserTooltipContent = ({classes, user}: {
//   classes: ClassesType,
//   user: UsersMinimumInfo,
// }) => {

//   const { FormatDate } = Components

//   const { htmlBio } = user

//   const truncatedBio = truncate(htmlBio, 500)
//   const postCount = userGetPostCount(user)
//   const commentCount = userGetCommentCount(user)
//   const wikiContributionCount = user.tagRevisionCount
//   const sequenceCount = user.sequenceCount; // TODO: Counts LW sequences on Alignment Forum

//   return <span>
//     <div className={classes.joined}>Joined on <FormatDate date={user.createdAt} format="MMM Do YYYY" /></div>
//     { !!sequenceCount && <div>
//         <BookIcon className={classNames(classes.icon, classes.bookIcon)}/> { sequenceCount } sequence{sequenceCount !== 1 && 's'}
//       </div>}
//     { !!postCount && <div><DescriptionIcon className={classes.icon} /> { postCount } post{postCount !== 1 && 's'}</div>}
//     { !!commentCount && <div><MessageIcon className={classes.icon}  /> { commentCount } comment{commentCount !== 1 && 's'}</div>}
//     { !!wikiContributionCount && <div><TagIcon className={classes.icon}  /> { wikiContributionCount } {taggingNameIsSet.get() ? taggingNameSetting.get() : 'wiki'} contribution{wikiContributionCount !== 1 && 's'}</div>}
//     { truncatedBio && <div className={classes.bio } dangerouslySetInnerHTML={{__html: truncatedBio}}/>}
//   </span>
// }

// const LWUserTooltipContentComponent = registerComponent(
//   'LWUserTooltipContent',
//   LWUserTooltipContent,
//   {styles},
// );

// declare global {
//   interface ComponentTypes {
//     LWUserTooltipContent: typeof LWUserTooltipContentComponent
//   }
// }
