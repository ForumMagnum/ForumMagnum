import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { Tags } from '../../lib/collections/tags/collection';
import { Link } from '../../lib/reactRouterWrapper';
import { useCurrentUser } from '../common/withUser';
import { userCanManageTags } from '../../lib/betas';
import { TagRels } from '../../lib/collections/tagRels/collection';
import { useMulti } from '../../lib/crud/withMulti';
import TableCell from '@material-ui/core/TableCell';
import TableRow from '@material-ui/core/TableRow';

const styles = theme => ({
  root: {
    background: "white",
    ...theme.typography.commentStyle,
  },
  description: {
    width: 540,
    position: "relative",
    paddingRight: 20,
    paddingTop: 8,
    paddingBottom: 8,
    verticalAlign: "top",
  },
  meta: {
    color: theme.palette.grey[500],
    fontSize: "1rem",
    position: "relative",
    marginTop: 6,
    display: "block"
  },
  addPostsToTag: {
    '& input': {
      color: theme.palette.grey[500],
      marginTop: 6,
      fontSize: "1rem"
    }
  },
  posts: {
    verticalAlign: "top",
  },
  post: {
    fontSize: "1.1rem",
    color: theme.palette.grey[600],
    marginBottom: 4,
  },
  postCount: {
    display: "block",
    marginBottom: 8,
    fontSize: "1rem",
    color: theme.palette.grey[500],
  },
  edit: {
    color: theme.palette.grey[500],
    fontSize: "1rem"
  }
});

const TagsListItem = ({tag, classes }: {
  tag: TagPreviewFragment,
  classes: ClassesType,
}) => {
  const { LinkCard, TagPreviewDescription, TagSmallPostLink } = Components;
  const currentUser = useCurrentUser();

  const { results } = useMulti({
    skip: !(tag._id),
    terms: {
      view: "postsWithTag",
      tagId: tag._id,
    },
    collection: TagRels,
    fragmentName: "TagRelFragment",
    limit: 3,
    itemsPerPage: 20,
    ssr: true,
  });

  return <TableRow className={classes.root}>
    <TableCell className={classes.description}>
      <LinkCard to={Tags.getUrl(tag)}>
        <TagPreviewDescription tag={tag} />
      </LinkCard>
      {userCanManageTags(currentUser) && <Link to={`${Tags.getUrl(tag)}/edit`} className={classes.edit}>
        Edit
      </Link>}
    </TableCell>

    <TableCell className={classes.posts}>
      <Link to={Tags.getUrl(tag)} className={classes.postCount}>
        {tag.postCount} posts tagged <em>{ tag.name }</em>
      </Link>
      {results && results.map((result,i) =>
        <div key={result.post._id} className={classes.post}>
          <TagSmallPostLink post={result.post} />
        </div>
      )}
    </TableCell>
  </TableRow>
}

const TagsListItemComponent = registerComponent("TagsListItem", TagsListItem, {styles});

declare global {
  interface ComponentTypes {
    TagsListItem: typeof TagsListItemComponent
  }
}
