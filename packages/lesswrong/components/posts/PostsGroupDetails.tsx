import { registerComponent } from '../../lib/vulcan-lib/components';
import { useSingle } from '../../lib/crud/withSingle';
import React from 'react';
import { Link } from '../../lib/reactRouterWrapper';
import classNames from 'classnames'
import { isFriendlyUI } from '../../themes/forumTheme';

const styles = (theme: ThemeType) => ({
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
    fontFamily: isFriendlyUI
      ? theme.palette.fonts.sansSerifStack
      : theme.typography.body1.fontFamily,
  },
  recentDiscussionTitle: {
    fontSize: 16,
    fontFamily: theme.typography.fontFamily
  },
  root: {
    marginBottom: isFriendlyUI ? 5 : 12, 
    marginTop: 10
  }
})

const PostsGroupDetailsInner = ({ documentId, post, inRecentDiscussion, classes }: {
  documentId: string,
  post: PostsBase,
  inRecentDiscussion?: Boolean,
  classes: ClassesType<typeof styles>,
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

export const PostsGroupDetails = registerComponent(
  'PostsGroupDetails', PostsGroupDetailsInner, { styles }
);

declare global {
  interface ComponentTypes {
    PostsGroupDetails: typeof PostsGroupDetails
  }
}
