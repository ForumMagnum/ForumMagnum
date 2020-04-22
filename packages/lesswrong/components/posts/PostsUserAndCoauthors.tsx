import { registerComponent, Components } from '../../lib/vulcan-lib';
import React from 'react';
import ModeCommentIcon from '@material-ui/icons/ModeComment';

const styles = theme => ({
  lengthLimited: {
    maxWidth: 310,
    textOverflow: "ellipsis",
    overflowX: "hidden",
    textAlign: "right",
    [theme.breakpoints.down('sm')]: {
      maxWidth: 160
    },
  },
  lengthUnlimited: {
    display: "inline",
  },
  bestAnswerAuthor: {
    color: theme.palette.grey[500],
    fontSize: ".95rem"
  },
  bestAuthorIcon: {
    width: 12,
    height: 12,
    color: "#d0d0d0",
    position: "relative",
    top: 2,
    marginRight: 4,
    marginLeft: 2,
  }
});

const PostsUserAndCoauthors = ({post, abbreviateIfLong=false, classes, simple=false}: {
  post: PostsList,
  abbreviateIfLong?: boolean,
  classes: ClassesType,
  simple?: boolean
}) => {
  const { UsersName, UserNameDeleted } = Components
  if (!post.user || post.hideAuthor)
    return <UserNameDeleted/>;
  
  const bestAnswerAuthor = post.bestAnswer?.user
  const renderBestAnswerAuthor = bestAnswerAuthor && bestAnswerAuthor._id  != post.user._id
  
  return <div className={abbreviateIfLong ? classes.lengthLimited : classes.lengthUnlimited}>
    {<UsersName user={post.user} simple={simple} />}
    {post.coauthors.map(coauthor =>
      <React.Fragment key={coauthor._id}>, <UsersName user={coauthor} simple={simple}  /></React.Fragment>)}
    {renderBestAnswerAuthor && <span className={classes.bestAnswerAuthor}>, <ModeCommentIcon className={classes.bestAuthorIcon}/>
      <UsersName user={post.bestAnswer.user} simple={simple} />
    </span>}
  </div>;
};

const PostsUserAndCoauthorsComponent = registerComponent("PostsUserAndCoauthors", PostsUserAndCoauthors, {styles});

declare global {
  interface ComponentTypes {
    PostsUserAndCoauthors: typeof PostsUserAndCoauthorsComponent
  }
}
