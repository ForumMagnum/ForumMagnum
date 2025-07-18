import React from 'react';
import { registerComponent } from '../../../lib/vulcan-lib/components';
import { postGetPageUrl } from '../../../lib/collections/posts/helpers';
import { Link } from '../../../lib/reactRouterWrapper'
import { useCurrentUser } from '../../common/withUser';
import { isMod } from '../../../lib/collections/users/helpers';
import { forumSelect } from '../../../lib/forumTypeUtils';
import Datatable, { Column } from '../../vulcan-core/Datatable';
import FormatDate from "../../common/FormatDate";
import UsersName from "../../users/UsersName";
import UsersNameWrapper from "../../users/UsersNameWrapper";
import SingleColumnSection from "../../common/SingleColumnSection";
import RejectedPostsList from "./RejectedPostsList";
import RejectedCommentsList from "./RejectedCommentsList";
import SectionTitle from "../../common/SectionTitle";
import ToCColumn from "../../posts/TableOfContents/ToCColumn";
import TableOfContents from "../../posts/TableOfContents/TableOfContents";
import { gql } from '@/lib/generated/gql-codegen';
import { NetworkStatus } from '@apollo/client';
import { useQueryWithLoadMore } from '@/components/hooks/useQueryWithLoadMore';

const DeletedCommentsModerationLogQuery = gql(`
  query DeletedCommentsModerationLogQuery($selector: CommentSelector, $limit: Int, $enableTotal: Boolean) {
    comments(selector: $selector, limit: $limit, enableTotal: $enableTotal) {
      results {
        ...DeletedCommentsModerationLog
      }
      totalCount
    }
  }
`);

const UsersBannedFromPostsModerationLogQuery = gql(`
  query UsersBannedFromPostsModerationLogQuery($selector: PostSelector, $limit: Int, $enableTotal: Boolean) {
    posts(selector: $selector, limit: $limit, enableTotal: $enableTotal) {
      results {
        ...UsersBannedFromPostsModerationLog
      }
      totalCount
    }
  }
`);

const UsersBannedFromUsersModerationLogQuery = gql(`
  query UsersBannedFromUsersModerationLogQuery($selector: UserSelector, $limit: Int, $enableTotal: Boolean) {
    users(selector: $selector, limit: $limit, enableTotal: $enableTotal) {
      results {
        ...UsersBannedFromUsersModerationLog
      }
      totalCount
    }
  }
`);

const ModeratorActionModerationLogQuery = gql(`
  query ModeratorActionModerationLogQuery($selector: ModeratorActionSelector, $limit: Int, $enableTotal: Boolean) {
    moderatorActions(selector: $selector, limit: $limit, enableTotal: $enableTotal) {
      results {
        ...ModeratorActionDisplay
      }
      totalCount
    }
  }
`);

const UserRateLimitModerationLogQuery = gql(`
  query UserRateLimitModerationLogQuery($selector: UserRateLimitSelector, $limit: Int, $enableTotal: Boolean) {
    userRateLimits(selector: $selector, limit: $limit, enableTotal: $enableTotal) {
      results {
        ...UserRateLimitDisplay
      }
      totalCount
    }
  }
`);

const shouldShowEndUserModerationToNonMods = forumSelect({
  EAForum: false,
  LessWrong: true,
  AlignmentForum: true,
  default: true,
})

const styles = (theme: ThemeType) => ({
  root: {
    fontFamily: theme.typography.fontFamily,
  },
  section: {
    border: theme.palette.border.normal,
    padding: 10,
    marginBottom: 16,
    borderRadius: 2,
    background: theme.palette.background.pageActiveAreaBackground,
    "& h1": {
      ...theme.typography.display3,
    },
  
    "& h2": {
      ...theme.typography.display2,
    },
  
    "& h3": {
      ...theme.typography.display1,
      marginTop: 0,
      marginBottom: "0.5em",
    },
  }
})

const DateDisplay = ({column, document}: {
  column: Column;
  document: AnyBecauseTodo;
}) => {
  return <div>{document[column.name] && <FormatDate date={document[column.name]}/>}</div>
}

const PostDisplay = ({column, document}: {
  column: Column;
  document: AnyBecauseTodo;
}) => {
  const post = document.post || document
  return <Link rel="nofollow" to={postGetPageUrl(post) + "#" + document._id }>{ post.title }</Link>
}

const UserDisplay = ({column, document}: {
  column: Column;
  document: AnyBecauseTodo;
}) => {
  const user = document.user || document
  return <div>
    <UsersName user={user} nofollow />
  </div>
}

const DeletedByUserDisplay = ({column, document}: {
  column: Column;
  document: AnyBecauseTodo;
}) => {
  const user = document.deletedByUser || document.user || document
  return <span>
    <UsersName user={user} nofollow />
  </span>
}


const BannedUsersDisplay = ({column, document}: {
  column: Column;
  document: AnyBecauseTodo;
}) => {
  const bannedUsers = document[column.name] ?? []
  return <div>
    { bannedUsers.map((userId: string) => <div key={userId}>
      <UsersNameWrapper documentId={userId} nofollow />
      </div>)}
  </div>
}

const ModeratorTypeDisplay = ({column, document}: {
  column: Column;
  document: AnyBecauseTodo;
}) => {
  return <div>{document[column.name]}</div>
}


const deletedCommentColumns: Column[] = [
  {
    name: 'Comment Author',
    component: UserDisplay,
  },
  {
    name: 'post',
    component: PostDisplay,
  },
  {
    name: 'deletedByUser',
    component: DeletedByUserDisplay,
  },
  {
    name: 'deletedDate',
    label: 'Deleted Date',
    component: DateDisplay,
  },
  {
    name:'deletedPublic',
    label:'Deleted Public'
  },
  {
    name:'deletedReason',
    label:'Reason'
  },
]

const moderatorActionColumns: Column[] = [
  {
    name: 'user',
    component: UserDisplay
  },
  {
    name: 'endedAt',
    component: DateDisplay,
  },
  {
    name: 'type',
    component: ModeratorTypeDisplay
  }
]

const userRateLimitColumns: Column[] = [
  {
    name: 'user',
    component: UserDisplay
  },
  {
    name: 'endedAt',
    component: DateDisplay,
  },
  {
    name: 'type',
    component: ModeratorTypeDisplay
  }
]

const usersBannedFromPostsColumns: Column[] = [
  {
    name: 'user',
    label: "Author",
    component: UserDisplay,
  },
  {
    name: '_id',
    label: 'Post',
    component: PostDisplay,
  },
  {
    name:'bannedUserIds',
    label:'Banned Users',
    component: BannedUsersDisplay
  },
]

const usersBannedFromUsersColumns: Column[] = [
  {
    name: '_id',
    component: UserDisplay,
  },
  {
    name:'bannedUserIds',
    label:'Banned From Frontpage',
    component: BannedUsersDisplay
  },
  {
    name:'bannedPersonalUserIds',
    label:'Banned from Personal Posts',
    component: BannedUsersDisplay
  },
]

const sectionData = {
  html: "",
  sections: [
    {
      title: "Deleted Comments",
      anchor: "deleted-comments",
      level: 1
    },
    {
      title: "Users Banned From Posts",
      anchor: "users-banned-from-posts",
      level: 1
    },
    {
      title: "Users Banned From Users",
      anchor: "users-banned-from-users",
      level: 1
    },
    {
      title: "Moderated Users",
      anchor: "moderated-users",
      level: 1
    },
    {
      title: "Rate Limited Users",
      anchor: "rate-limited-users",
      level: 1
    },
    {
      title: "Rejected Posts",
      anchor: "rejected-posts",
      level: 1
    },
    {
      title: "Rejected Comments",
      anchor: "rejected-comments",
      level: 1
    },
  ],
};

const ModerationLog = ({classes}: {
  classes: ClassesType<typeof styles>
}) => {
  const currentUser = useCurrentUser()
  const shouldShowEndUserModeration = (currentUser && isMod(currentUser)) || shouldShowEndUserModerationToNonMods;

  const {
    data: deletedCommentsData,
    loading: deletedCommentsLoading,
    networkStatus: deletedCommentsNetworkStatus,
    loadMoreProps: { loadMore: deletedCommentsLoadMore, count: deletedCommentsCount, totalCount: deletedCommentsTotalCount },
  } = useQueryWithLoadMore(DeletedCommentsModerationLogQuery, {
    variables: { selector: { allCommentsDeleted: {} }, limit: 10, enableTotal: true },
  });

  const deletedCommentsResults = deletedCommentsData?.comments?.results ?? [];
  const deletedCommentsLoadingMore = deletedCommentsNetworkStatus === NetworkStatus.fetchMore;

  const {
    data: usersBannedFromPostsData,
    loading: usersBannedFromPostsLoading,
    networkStatus: usersBannedFromPostsNetworkStatus,
    loadMoreProps: { loadMore: usersBannedFromPostsLoadMore, count: usersBannedFromPostsCount, totalCount: usersBannedFromPostsTotalCount },
  } = useQueryWithLoadMore(UsersBannedFromPostsModerationLogQuery, {
    variables: { selector: { postsWithBannedUsers: {} }, limit: 10, enableTotal: true },
  });

  const usersBannedFromPostsResults = usersBannedFromPostsData?.posts?.results ?? [];
  const usersBannedFromPostsLoadingMore = usersBannedFromPostsNetworkStatus === NetworkStatus.fetchMore;

  const {
    data: usersBannedFromUsersData,
    loading: usersBannedFromUsersLoading,
    networkStatus: usersBannedFromUsersNetworkStatus,
    loadMoreProps: { loadMore: usersBannedFromUsersLoadMore, count: usersBannedFromUsersCount, totalCount: usersBannedFromUsersTotalCount },
  } = useQueryWithLoadMore(UsersBannedFromUsersModerationLogQuery, {
    variables: { selector: { usersWithBannedUsers: {} }, limit: 10, enableTotal: true },
  });

  const usersBannedFromUsersResults = usersBannedFromUsersData?.users?.results ?? [];
  const usersBannedFromUsersLoadingMore = usersBannedFromUsersNetworkStatus === NetworkStatus.fetchMore;

  const {
    data: moderatorActionsData,
    loading: moderatorActionsLoading,
    networkStatus: moderatorActionsNetworkStatus,
    loadMoreProps: { loadMore: moderatorActionsLoadMore, count: moderatorActionsCount, totalCount: moderatorActionsTotalCount },
  } = useQueryWithLoadMore(ModeratorActionModerationLogQuery, {
    variables: { selector: { restrictionModerationActions: {} }, limit: 10, enableTotal: true },
  });

  const moderatorActionsResults = moderatorActionsData?.moderatorActions?.results ?? [];
  const moderatorActionsLoadingMore = moderatorActionsNetworkStatus === NetworkStatus.fetchMore;

  const {
    data: userRateLimitsData,
    loading: userRateLimitsLoading,
    networkStatus: userRateLimitsNetworkStatus,
    loadMoreProps: { loadMore: userRateLimitsLoadMore, count: userRateLimitsCount, totalCount: userRateLimitsTotalCount },
  } = useQueryWithLoadMore(UserRateLimitModerationLogQuery, {
    variables: { selector: { activeUserRateLimits: {} }, limit: 10, enableTotal: true },
  });

  const userRateLimitsResults = userRateLimitsData?.userRateLimits?.results ?? [];
  const userRateLimitsLoadingMore = userRateLimitsNetworkStatus === NetworkStatus.fetchMore;

  return (
    <ToCColumn tableOfContents={<TableOfContents
        sectionData={sectionData}
        title={"Moderation Log"}
      />}>
      <SingleColumnSection className={classes.root}>
        <SectionTitle title="Moderation Log"/>
        <div className={classes.section}>
          <h3 id="deleted-comments">Deleted Comments</h3>
          <Datatable
            collectionName="Comments"
            columns={deletedCommentColumns}
            results={deletedCommentsResults}
            loading={deletedCommentsLoading}
            loadMore={deletedCommentsLoadMore}
            count={deletedCommentsCount}
            totalCount={deletedCommentsTotalCount ?? 0}
            loadingMore={deletedCommentsLoadingMore}
          />
        </div>
        {shouldShowEndUserModeration && <>
          <div className={classes.section}>
            <h3 id="users-banned-from-posts">Users Banned From Posts</h3>
            <Datatable
              collectionName="Posts"
              columns={usersBannedFromPostsColumns}
              results={usersBannedFromPostsResults}
              loading={usersBannedFromPostsLoading}
              loadMore={usersBannedFromPostsLoadMore}
              count={usersBannedFromPostsCount}
              totalCount={usersBannedFromPostsTotalCount ?? 0}
              loadingMore={usersBannedFromPostsLoadingMore}
            />
          </div>
          <div className={classes.section}>
            <h3 id="users-banned-from-users">Users Banned From Users</h3>
            <Datatable
              collectionName="Users"
              columns={usersBannedFromUsersColumns}
              results={usersBannedFromUsersResults}
              loading={usersBannedFromUsersLoading}
              loadMore={usersBannedFromUsersLoadMore}
              count={usersBannedFromUsersCount}
              totalCount={usersBannedFromUsersTotalCount ?? 0}
              loadingMore={usersBannedFromUsersLoadingMore}
            />
          </div>
          <div className={classes.section}>
            <h3 id="moderated-users">Moderated Users</h3>
            <Datatable
              collectionName="ModeratorActions"
              columns={moderatorActionColumns}
              results={moderatorActionsResults}
              loading={moderatorActionsLoading}
              loadMore={moderatorActionsLoadMore}
              count={moderatorActionsCount}
              totalCount={moderatorActionsTotalCount ?? 0}
              loadingMore={moderatorActionsLoadingMore}
            />
          </div>
          <div className={classes.section}>
            <h3 id="rate-limited-users">Rate Limited Users</h3>
            <Datatable
              collectionName="UserRateLimits"
              columns={userRateLimitColumns}
              results={userRateLimitsResults}
              loading={userRateLimitsLoading}
              loadMore={userRateLimitsLoadMore}
              count={userRateLimitsCount}
              totalCount={userRateLimitsTotalCount ?? 0}
              loadingMore={userRateLimitsLoadingMore}
            />
          </div>
        </>}
        <div>
          <SectionTitle title="Rejected Posts" anchor="rejected-posts"/>
          <RejectedPostsList />
          <SectionTitle title="Rejected Comments" anchor="rejected-comments"/>
          <RejectedCommentsList />
        </div>
      </SingleColumnSection>
    </ToCColumn>
  )
}

export default registerComponent('ModerationLog', ModerationLog, {styles});


