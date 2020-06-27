import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { Tags } from '../../lib/collections/tags/collection';
import Users from '../../lib/collections/users/collection';
import { Link } from '../../lib/reactRouterWrapper';
import EditOutlinedIcon from '@material-ui/icons/EditOutlined';

const styles = theme => ({
  tag: {
    display: "flex",
    width: "100%",
    borderBottom: "solid 2px rgba(0,0,0,.05)",
    backgroundColor: "white",
    paddingLeft: 12,
    paddingRight: 12,
    paddingTop: 3,
    paddingBottom: 6,
    justifyContent: "space-between",
    alignItems: "center"
  },
  description: {
    maxWidth: 640
  },
  meta: {
    ...theme.typography.commentStyle,
    color: theme.palette.grey[600],
    fontSize: "1rem",
    position: "relative",
    textAlign: "right"
  },
  editIcon: {
    height: 16,
    width: 16,
    marginLeft: 12,
    color: theme.palette.grey[500]
  }
});

const TagsListItem = ({tag, classes }: {
  tag: TagPreviewFragment,
  classes: ClassesType,
}) => {
  const { LinkCard, TagPreviewDescription } = Components;
  const currentUser = useCurrentUser();
  
  return <div className={classes.tag}>
    <LinkCard to={Tags.getUrl(tag)} className={classes.description}>
      <TagPreviewDescription tag={tag} />
    </LinkCard>
    <div className={classes.meta}>
      {tag.postCount} Posts 
      <Link to={`${Tags.getUrl(tag)}/edit`}>
        {Users.isAdmin(currentUser) && <EditOutlinedIcon className={classes.editIcon}/>}
      </Link>
    </div>
  </div>
}

const TagsListItemComponent = registerComponent("TagsListItem", TagsListItem, {styles});

declare global {
  interface ComponentTypes {
    TagsListItem: typeof TagsListItemComponent
  }
}
