import React, { useState } from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { Tags } from '../../lib/collections/tags/collection';
import { Link } from '../../lib/reactRouterWrapper';
import { useCurrentUser } from '../common/withUser';
import { userCanManageTags } from '../../lib/betas';
import TableCell from '@material-ui/core/TableCell';
import TableRow from '@material-ui/core/TableRow';
import { EditTagForm } from './EditTagPage';

const styles = theme => ({
  root: {
    background: "white",
    ...theme.typography.commentStyle
  },
  description: {
    width: 640,
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
});

const TagsDetailsItem = ({tag, classes }: {
  tag: TagPreviewFragment,
  classes: ClassesType,
}) => {
  const { LinkCard, TagPreviewDescription } = Components;
  const currentUser = useCurrentUser();
  const [ editing, setEditing ] = useState(false)

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
    <TableCell>
      <div>
        {userCanManageTags(currentUser) && 
          <a onClick={() => setEditing(true)} className={classes.metaInfo}>
            Edit
          </a>
        }
        <Link to={Tags.getUrl(tag)} className={classes.metaInfo}>
          {tag.postCount} posts
        </Link>
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
