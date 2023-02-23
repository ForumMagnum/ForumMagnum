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
    lineHeight: '24px',
    color: theme.palette.text.dim,
    marginTop: -10,
  },
  serif: {
    fontFamily: theme.typography.body1.fontFamily,
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

  if (!document) {
    return null
  }
  
  let groupName
  if (post.group) {
    groupName = document.deleted ? document.name : <Link to={'/groups/' + post.group._id }>{ document.name }</Link>
  }

  return <div className={inRecentDiscussion ? '' : classes.root}>
    <div className={classNames(classes.title, {[classes.sansSerif]: inRecentDiscussion, [classes.serif]: !inRecentDiscussion})}>
      {groupName}
    </div>
  </div>
}

const PostsGroupDetailsComponent = registerComponent(
  'PostsGroupDetails', PostsGroupDetails, { styles }
);

declare global {
  interface ComponentTypes {
    PostsGroupDetails: typeof PostsGroupDetailsComponent
  }
}
