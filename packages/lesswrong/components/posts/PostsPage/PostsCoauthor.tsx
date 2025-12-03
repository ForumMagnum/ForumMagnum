import React from 'react'
import { registerComponent } from '../../../lib/vulcan-lib/components';
import UsersName from "../../users/UsersName";
import UserCommentMarkers from "../../users/UserCommentMarkers";

export const AUTHOR_MARKER_STYLES = {
  display: "inline-block",
  marginLeft: 3,
  marginRight: -3,
};

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


