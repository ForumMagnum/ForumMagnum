import { registerComponent } from '../../lib/vulcan-lib';
import { useSingle } from '../../lib/crud/withSingle';
import React from 'react';
import { Link } from '../../lib/reactRouterWrapper';
import classNames from 'classnames'

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
  sansSerif: {
    fontSize: 16,
    fontFamily: theme.typography.fontFamily
  },
  root: {
    marginBottom: 5, 
    marginTop: 10
  }
})

const PostsGroupDetails = ({ documentId, post, inRecentDiscussion, classes }: {
  documentId: string,
  post: PostsBase,
  inRecentDiscussion?: Boolean,
  classes: ClassesType,
}) => {
  const { document } = useSingle({
    documentId,
    collectionName: "Localgroups",
    fragmentName: 'localGroupsHomeFragment',
  });
  if (document) {
    return <div className={inRecentDiscussion ? '' : classes.root}>
      <div className={inRecentDiscussion ? classNames(classes.title, classes.sansSerif) : classes.title}>
        {post?.group && <Link to={'/groups/' + post.group._id }>{ document.name }</Link>}
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

