import { registerComponent, Components } from '../../lib/vulcan-lib';
import React from 'react';

const styles = theme => ({
  lengthLimited: {
    maxWidth: 310,
    textOverflow: "ellipsis",
    overflowX: "hidden",
    [theme.breakpoints.down('xs')]: {
      maxWidth: 160
    },
  },
  lengthUnlimited: {
    display: "inline",
  },
});

const PostsUserAndCoauthors = ({post, abbreviateIfLong=false, classes, simple=false}: {
  post: PostsList,
  abbreviateIfLong?: boolean,
  classes: ClassesType,
  simple?: boolean
}) => {
  if (!post.user || post.hideAuthor)
    return <Components.UserNameDeleted/>;
  
  return <div className={abbreviateIfLong ? classes.lengthLimited : classes.lengthUnlimited}>
    {<Components.UsersName user={post.user} simple={simple} />}
    {post.coauthors.map(coauthor =>
      <React.Fragment key={coauthor._id}>, <Components.UsersName user={coauthor} simple={simple}  /></React.Fragment>)}
  </div>;
};

const PostsUserAndCoauthorsComponent = registerComponent("PostsUserAndCoauthors", PostsUserAndCoauthors, {styles});

declare global {
  interface ComponentTypes {
    PostsUserAndCoauthors: typeof PostsUserAndCoauthorsComponent
  }
}
