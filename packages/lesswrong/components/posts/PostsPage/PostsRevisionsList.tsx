import React from 'react'
import { registerComponent, Components } from '../../../lib/vulcan-lib';
import { useSingle } from '../../../lib/crud/withSingle';
import MenuItem from '@material-ui/core/MenuItem';
import { QueryLink } from '../../../lib/reactRouterWrapper';
import { useNavigation } from '../../../lib/routeUtil';


const styles = (theme: ThemeType): JssStyles => ({
  version: {
    marginRight: 5
  }
})

const PostsRevisionsList = ({post, classes}: {
  post: PostsBase,
  classes: ClassesType,
}) => {
  const { history } = useNavigation();
  const { document, loading } = useSingle({
    documentId: post._id,
    collectionName: "Posts",
    fetchPolicy: 'network-only', // Ensure that we load the list of revisions a new every time we click (this is useful after editing a post)
    fragmentName: 'PostsRevisionsList'
  });
  const { FormatDate } = Components
  if (loading || !document) {return <MenuItem disabled> Loading... </MenuItem>} 
  const { revisions } = document
  
  // MenuItem takes a component and passes unrecognized props to that component,
  // but its material-ui-provided type signature does not include this feature.
  // Cast to any to work around it, to be able to pass a "to" parameter.
  const MenuItemUntyped = MenuItem as any;
  
  return <React.Fragment>
    {revisions.map(({editedAt, version}) =>
      <MenuItemUntyped key={version} component={QueryLink} query={{revision: version}} merge>
        <span className={classes.version}>View v{version}</span> (<FormatDate date={editedAt}/>)
      </MenuItemUntyped>)}
    
    <MenuItem onClick={ev => history.push(`/revisions/post/${post._id}/${post.slug}`)}>
      Compare Revisions
    </MenuItem>
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
