import { registerComponent } from '../../../lib/vulcan-lib/components';
import { Typography } from "../../common/Typography";
import UserCommentMarkers from "../../users/UserCommentMarkers";
import UserNameDeleted from "../../users/UserNameDeleted";
import UsersName from "../../users/UsersName";
import PostsCoauthor from "./PostsCoauthor";
import { AUTHOR_MARKER_STYLES } from "./authorMarkerStyles";

const styles = (theme: ThemeType) => ({
  root: {
    textAlign: 'left',
    display: 'inline',
  },
  authorName: {
    fontWeight: 600,
    marginLeft: 0,
  },
  authorMarkers: AUTHOR_MARKER_STYLES,
})

const PostsAuthors = ({classes, post, pageSectionContext}: {
  classes: ClassesType<typeof styles>,
  post: PostsList,
  pageSectionContext?: string,
}) => {
  return <Typography variant="body1" component="span" className={classes.root}>
    by <span className={classes.authorName}>
      {!post.user || post.hideAuthor
        ? <UserNameDeleted/>
        : <>
          <UsersName user={post.user} pageSectionContext={pageSectionContext} />
          <UserCommentMarkers user={post.user} className={classes.authorMarkers} />
        </>
      }
      {post.coauthors?.map(coauthor =>
        <PostsCoauthor key={coauthor._id} coauthor={coauthor} pageSectionContext={pageSectionContext} />
      )}
    </span>
  </Typography>
}

export default registerComponent('PostsAuthors', PostsAuthors, {styles});


