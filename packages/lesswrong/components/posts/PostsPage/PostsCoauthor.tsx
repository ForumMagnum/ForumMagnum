import React from 'react'
import { registerComponent } from '../../../lib/vulcan-lib/components';
import { AUTHOR_MARKER_STYLES } from './PostsAuthors';
import UsersName from "../../users/UsersName";
import UserCommentMarkers from "../../users/UserCommentMarkers";

const styles = (_: ThemeType) => ({
  markers: AUTHOR_MARKER_STYLES,
});

const PostsCoauthor = ({ coauthor, pageSectionContext, classes }: {
  coauthor: UsersMinimumInfo,
  pageSectionContext?: string,
  classes: ClassesType<typeof styles>,
}) => {
  return (
    <>
      , <UsersName user={coauthor} pageSectionContext={pageSectionContext} />
      <UserCommentMarkers user={coauthor} className={classes.markers} />
    </>
  );
}

export default registerComponent(
  'PostsCoauthor',
  PostsCoauthor,
  {styles},
);


