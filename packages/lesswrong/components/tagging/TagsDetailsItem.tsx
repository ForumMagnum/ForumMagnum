import React, { useState } from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { Tags } from '../../lib/collections/tags/collection';
import { Link } from '../../lib/reactRouterWrapper';
import { useCurrentUser } from '../common/withUser';
import { userCanManageTags } from '../../lib/betas';
import { TagRels } from '../../lib/collections/tagRels/collection';
import { useMulti } from '../../lib/crud/withMulti';
import TableCell from '@material-ui/core/TableCell';
import TableRow from '@material-ui/core/TableRow';
import { EditTagForm } from './EditTagPage';
import EditOutlinedButton from '@material-ui/icons/EditOutlined';

const styles = theme => ({
  root: {
    background: "white",
    ...theme.typography.commentStyle,
    '&:hover $editIcon': {
      color: theme.palette.grey[700]
    }
  },
  description: {
    width: 540,
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
    position: "relative"
  },
  post: {
    fontSize: "1.1rem",
    color: theme.palette.grey[600],
    lineHeight: "1.1em",
    marginBottom: 8,
  },
  postCount: {
    display: "block",
    marginTop: 3,
    marginBottom: 12,
    fontSize: "1rem",
    color: theme.palette.grey[500],
  },
  metaInfo: {
    display: "flex",
    justifyContent: "space-between", 
    alignItems: "flex-start"
  },
  edit: {
    position: "absolute",
    top: 12,
    right: 10
  },
  editIcon: {
    height: 16,
    color: theme.palette.grey[400]
  }
});

const TagsDetailsItem = ({tag, classes }: {
  tag: TagPreviewFragment,
  classes: ClassesType,
}) => {
  const { LinkCard, TagPreviewDescription, TagSmallPostLink } = Components;
  const currentUser = useCurrentUser();
  const [ editing, setEditing ] = useState(false)

  const { results } = useMulti({
    skip: !(tag._id),
    terms: {
      view: "postsWithTag",
      tagId: tag._id,
    },
    collection: TagRels,
    fragmentName: "TagRelFragment",
    limit: 3,
    ssr: true,
  });

  return <TableRow className={classes.root}>
    <TableCell className={classes.description}>
      {editing ? 
        <EditTagForm tag={tag} successCallback={()=>setEditing(false)}/>
        :
        <LinkCard to={Tags.getUrl(tag)}>
          <TagPreviewDescription tag={tag} />
        </LinkCard>
      }
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
      {userCanManageTags(currentUser) && 
        <a onClick={() => setEditing(true)} className={classes.edit}>
          <EditOutlinedButton className={classes.editIcon} />
        </a>
      }
    </TableCell>
  </TableRow>
}

const TagsDetailsItemComponent = registerComponent("TagsDetailsItem", TagsDetailsItem, {styles});

declare global {
  interface ComponentTypes {
    TagsDetailsItem: typeof TagsDetailsItemComponent
  }
}
