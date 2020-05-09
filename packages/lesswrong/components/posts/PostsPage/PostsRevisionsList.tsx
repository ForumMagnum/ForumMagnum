import React from 'react'
import { registerComponent, Components } from '../../../lib/vulcan-lib';
import { useSingle } from '../../../lib/crud/withSingle';
import MenuItem from '@material-ui/core/MenuItem';
import { Posts } from '../../../lib/collections/posts/collection'
import { QueryLink } from '../../../lib/reactRouterWrapper';


const styles = theme => ({
  version: {
    marginRight: 5
  }
})

const PostsRevisionsList = ({documentId, classes}: {
  documentId: string,
  classes: ClassesType,
}) => {
  const { document, loading } = useSingle({
    documentId,
    collection: Posts,
    fetchPolicy: 'network-only', // Ensure that we load the list of revisions a new every time we click (this is useful after editing a post)
    fragmentName: 'PostsRevisionsList'
  });
  const { FormatDate } = Components
  if (loading || !document) {return <MenuItem disabled> Loading... </MenuItem>} 
  const { revisions } = document
  
  // MenuItem takes a component and passes unrecognized props to that component,
  // but its material-ui-provided type signature does not include this feature.
  // Case to any to work around it, to be able to pass a "to" parameter.
  const MenuItemUntyped = MenuItem as any;
  
  return <React.Fragment>
    {revisions.map(({editedAt, version}) =>
      <MenuItemUntyped key={version} component={QueryLink} query={{revision: version}} merge>
        <span className={classes.version}>v{version}</span> <FormatDate date={editedAt}/>
      </MenuItemUntyped>)}
  </React.Fragment>
}

const PostsRevisionsListComponent = registerComponent(
  'PostsRevisionsList', PostsRevisionsList, {styles}
);

declare global {
  interface ComponentTypes {
    PostsRevisionsList: typeof PostsRevisionsListComponent
  }
}
