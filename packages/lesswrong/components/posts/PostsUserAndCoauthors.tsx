import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import React from 'react';
import ModeCommentIcon from '@material-ui/icons/ModeComment';
import classNames from 'classnames';
import type { PopperPlacementType } from '@/lib/vendor/@material-ui/core/src/Popper'
import { usePostsUserAndCoauthors } from './usePostsUserAndCoauthors';

const styles = (theme: ThemeType) => ({
  lengthLimited: {
    maxWidth: 310,
    textOverflow: "ellipsis",
    overflowX: "clip",
    overflowY: 'clip',
    textAlign: "right",
    [theme.breakpoints.down('xs')]: {
      maxWidth: 160
    },
  },
  userMarkers: {
    marginLeft: 4,
  },
  lengthUnlimited: {
    display: "inline",
  },
  topCommentAuthor: {
    color: theme.palette.grey[500],
    fontSize: ".95rem"
  },
  topAuthorIcon: {
    width: 12,
    height: 12,
    color: theme.palette.icon.topAuthor,
    position: "relative",
    top: 2,
    marginRight: 4,
    marginLeft: 2,
  },
  new: {
    color: theme.palette.primary.main
  },
});

const PostsUserAndCoauthors = ({
  post,
  abbreviateIfLong=false,
  classes,
  simple=false,
  tooltipPlacement="left",
  newPromotedComments,
  showMarkers,
}: {
  post: PostsList | SunshinePostsList,
  abbreviateIfLong?: boolean,
  classes: ClassesType<typeof styles>,
  simple?: boolean,
  tooltipPlacement?: PopperPlacementType,
  newPromotedComments?: boolean,
  showMarkers?: boolean,
}) => {
  const {isAnon, topCommentAuthor, authors} = usePostsUserAndCoauthors(post);

  const {UsersName, UserNameDeleted, UserCommentMarkers} = Components

  if (isAnon)
    return <UserNameDeleted/>;

  return <div className={abbreviateIfLong ? classes.lengthLimited : classes.lengthUnlimited}>
    {authors.map((author, i) =>
      <React.Fragment key={author._id}>
        {i > 0 ? ", " : ""}
        <UsersName user={author} simple={simple} tooltipPlacement={tooltipPlacement}/>
        {showMarkers &&
          <UserCommentMarkers user={author} className={classes.userMarkers} />
        }
      </React.Fragment>
    )
    }
    {topCommentAuthor && <span className={classNames(classes.topCommentAuthor, {[classes.new]: newPromotedComments})}>
      {", "}<ModeCommentIcon className={classNames(classes.topAuthorIcon, {[classes.new]: newPromotedComments})}/>
      <UsersName user={topCommentAuthor || undefined} simple={simple} tooltipPlacement={tooltipPlacement} />
    </span>}
  </div>;
};

const PostsUserAndCoauthorsComponent = registerComponent("PostsUserAndCoauthors", PostsUserAndCoauthors, {styles});

declare global {
  interface ComponentTypes {
    PostsUserAndCoauthors: typeof PostsUserAndCoauthorsComponent
  }
}
