import { registerComponent } from '../../lib/vulcan-lib/components';
import React from 'react';
import ModeCommentIcon from '@/lib/vendor/@material-ui/icons/src/ModeComment';
import classNames from 'classnames';
import type { Placement as PopperPlacementType } from "popper.js"
import { usePostsUserAndCoauthors } from './usePostsUserAndCoauthors';
import UsersName from "../users/UsersName";
import UsersNameWithModal from "../ultraFeed/UsersNameWithModal";
import UserNameDeleted from "../users/UserNameDeleted";
import UserCommentMarkers from "../users/UserCommentMarkers";

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
  lengthLimitedCompact: {
    maxWidth: 200,
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
  useUltraFeedModal=false,
  compact=false,
  showSubscribedIcon=false,
}: {
  post: PostsList | SunshinePostsList,
  abbreviateIfLong?: boolean,
  classes: ClassesType<typeof styles>,
  simple?: boolean,
  tooltipPlacement?: PopperPlacementType,
  newPromotedComments?: boolean,
  showMarkers?: boolean,
  useUltraFeedModal?: boolean,
  compact?: boolean,
  showSubscribedIcon?: boolean,
}) => {
  const {isAnon, topCommentAuthor, authors} = usePostsUserAndCoauthors(post);
  const UserNameComponent = useUltraFeedModal ? UsersNameWithModal : UsersName;
  if (isAnon)
    return <UserNameDeleted/>;

  return <div className={classNames({
    [classes.lengthLimited]: abbreviateIfLong,
    [classes.lengthLimitedCompact]: abbreviateIfLong && compact,
    [classes.lengthUnlimited]: !abbreviateIfLong,
  })}>
    {authors.map((author, i) =>
      <React.Fragment key={author._id}>
        {i > 0 ? ", " : ""}
        <UserNameComponent 
          user={author} 
          simple={simple} 
          tooltipPlacement={tooltipPlacement}
          {...(useUltraFeedModal && { showSubscribedIcon })}
        />
        {showMarkers &&
          <UserCommentMarkers user={author} className={classes.userMarkers} />
        }
      </React.Fragment>
    )
    }
    {topCommentAuthor && <span className={classNames(classes.topCommentAuthor, {[classes.new]: newPromotedComments})}>
      {", "}<ModeCommentIcon className={classNames(classes.topAuthorIcon, {[classes.new]: newPromotedComments})}/>
      <UserNameComponent 
        user={topCommentAuthor || undefined} 
        simple={simple} 
        tooltipPlacement={tooltipPlacement}
        {...(useUltraFeedModal && { showSubscribedIcon })}
      />
    </span>}
  </div>;
};

export default registerComponent("PostsUserAndCoauthors", PostsUserAndCoauthors, {styles});


