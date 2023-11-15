import React from 'react'
import { registerComponent, Components } from '../../../lib/vulcan-lib';
import { useSingle } from '../../../lib/crud/withSingle';
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
  const { FormatDate, MenuItem } = Components
  if (loading || !document) {return <MenuItem disabled> Loading... </MenuItem>} 
  const { revisions } = document
  
  return <React.Fragment>
    {revisions.map(({editedAt, version}) =>
      <QueryLink key={version} query={{revision: version}} merge>
        <MenuItem>
          <span className={classes.version}>View v{version}</span> (<FormatDate date={editedAt}/>)
        </MenuItem>
      </QueryLink>)}
    
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
