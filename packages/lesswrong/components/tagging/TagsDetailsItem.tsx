import React, { useState } from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { Tags } from '../../lib/collections/tags/collection';
import { Link } from '../../lib/reactRouterWrapper';
import { useCurrentUser } from '../common/withUser';
import { userCanManageTags } from '../../lib/betas';
import TableCell from '@material-ui/core/TableCell';
import TableRow from '@material-ui/core/TableRow';
import { EditTagForm } from './EditTagPage';
import { useMulti } from '../../lib/crud/withMulti';
import { TagRels } from '../../lib/collections/tagRels/collection';

const styles = theme => ({
  root: {
    background: "white",
    ...theme.typography.commentStyle
  },
  description: {
    maxWidth: 540,
    paddingRight: 20,
    paddingTop: 8,
    paddingBottom: 8,
    verticalAlign: "top",
  },
  metaInfo: {
    fontSize: "1rem",
    color: theme.palette.grey[500],
    marginTop: 12,
    marginRight: 8
  },
  posts: {
    maxWidth: 200
  }
});

const TagsDetailsItem = ({tag, classes }: {
  tag: TagPreviewFragment,
  classes: ClassesType,
}) => {
  const { LinkCard, TagPreviewDescription, TagSmallPostLink, Loading } = Components;
  const currentUser = useCurrentUser();
  const [ editing, setEditing ] = useState(false)

  const { results: tagRels, loading } = useMulti({
    skip: !(tag._id),
    terms: {
      view: "postsWithTag",
      tagId: tag._id,
    },
    collection: TagRels,
    fragmentName: "TagRelFragment",
    limit: 3,
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
      {userCanManageTags(currentUser) && 
      <a onClick={() => setEditing(true)} className={classes.metaInfo}>
        Edit
      </a>}
    </TableCell>
    <TableCell className={classes.posts}>
      <div>
        <Link to={Tags.getUrl(tag)} className={classes.metaInfo}>
          {tag.postCount} posts tagged <em>{tag.name}</em>
        </Link>
        {!tagRels && loading && <Loading/>}
        {tagRels && tagRels.map(tagRel=>
          <TagSmallPostLink key={tagRel._id} post={tagRel.post} hideAuthor wrap/>
        )}
      </div>
    </TableCell>
  </TableRow>
}

const TagsDetailsItemComponent = registerComponent("TagsDetailsItem", TagsDetailsItem, {styles});

declare global {
  interface ComponentTypes {
    TagsDetailsItem: typeof TagsDetailsItemComponent
  }
}
