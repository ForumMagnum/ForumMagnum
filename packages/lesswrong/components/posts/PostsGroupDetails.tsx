import { registerComponent } from '../../lib/vulcan-lib/components';
import React from 'react';
import { Link } from '../../lib/reactRouterWrapper';
import classNames from 'classnames'
import { isFriendlyUI } from '../../themes/forumTheme';
import { useQuery } from "@apollo/client";
import { gql } from "@/lib/generated/gql-codegen/gql";

const localGroupsHomeFragmentQuery = gql(`
  query PostsGroupDetails($documentId: String) {
    localgroup(input: { selector: { documentId: $documentId } }) {
      result {
        ...localGroupsHomeFragment
      }
    }
  }
`);

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

const PostsGroupDetails = ({ documentId, post, inRecentDiscussion, classes }: {
  documentId: string,
  post: PostsBase,
  inRecentDiscussion?: boolean,
  classes: ClassesType<typeof styles>,
}) => {
  const { data } = useQuery(localGroupsHomeFragmentQuery, {
    variables: { documentId: documentId },
  });
  const document = data?.localgroup?.result;

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

export default registerComponent(
  'PostsGroupDetails', PostsGroupDetails, { styles }
);


