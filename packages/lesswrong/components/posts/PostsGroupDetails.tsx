import { registerComponent } from '../../lib/vulcan-lib';
import { useSingle } from '../../lib/crud/withSingle';
import React from 'react';
import { Link } from '../../lib/reactRouterWrapper';
import classNames from 'classnames'
import { isEAForum } from '../../lib/instanceSettings';

const styles = (theme: ThemeType): JssStyles => ({
  title: {
    display: 'inline-block',
    fontSize: 22,
    verticalAlign: '-webkit-baseline-middle',
    lineHeight: '24px',
    color: theme.palette.text.dim,
    marginTop: -10,
    ...theme.typography.smallCaps,
  },
  notRecentDiscussionTitle: {
    fontFamily: isEAForum
      ? theme.palette.fonts.sansSerifStack
      : theme.typography.body1.fontFamily,
  },
  recentDiscussionTitle: {
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

  let groupName: React.ReactNode;
  if (post.group) {
    groupName = document.deleted ? document.name : <Link to={'/groups/' + post.group._id }>{ document.name }</Link>
  }

  return <div className={inRecentDiscussion ? '' : classes.root}>
    <div className={classNames(classes.title, {
      [classes.recentDiscussionTitle]: inRecentDiscussion,
      [classes.notRecentDiscussionTitle]: !inRecentDiscussion,
    })}>
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
