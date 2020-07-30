import { registerComponent } from '../../lib/vulcan-lib';
import { useSingle } from '../../lib/crud/withSingle';
import React from 'react';
import { Link } from '../../lib/reactRouterWrapper';
import { Localgroups } from '../../lib/index';

const styles = (theme: ThemeType): JssStyles => ({
  title: {
    display: 'inline-block',
    fontSize: 22,
    verticalAlign: '-webkit-baseline-middle',
    fontVariant: 'small-caps',
    lineHeight: '24px',
    color: 'rgba(0,0,0,0.5)',
    marginTop: -10,
  },
  root: {
    marginBottom: 10, 
    marginTop: 10
  }
})

const PostsGroupDetails = ({ documentId, post, classes }: {
  documentId: string,
  post: PostsBase,
  classes: ClassesType,
}) => {
  const { document } = useSingle({
    documentId,
    collection: Localgroups,
    fragmentName: 'localGroupsHomeFragment',
  });
  if (document) {
    return <div className={classes.root}>
      <div className={classes.title}>
        {post && post.groupId && <Link to={'/groups/' + post.groupId }>{ document.name }</Link>}
      </div>
    </div>
  } else {
    return null
  }
}

const PostsGroupDetailsComponent = registerComponent(
  'PostsGroupDetails', PostsGroupDetails, { styles }
);

declare global {
  interface ComponentTypes {
    PostsGroupDetails: typeof PostsGroupDetailsComponent
  }
}

